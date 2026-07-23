import os
import re
import time
import concurrent.futures
import urllib.parse
import requests as http_requests
from flask import Blueprint, request, jsonify
from db import supabase

prices_bp = Blueprint("prices", __name__)

ANAKIN_API_KEY = os.getenv("ANAKIN_API_KEY", "")
TASK_URL = "https://api.anakin.io/v1/wire/task"
JOBS_URL = "https://api.anakin.io/v1/wire/jobs/{}"
HEADERS = {"X-API-Key": ANAKIN_API_KEY, "Content-Type": "application/json"}
POLL_TIMEOUT = 55
POLL_INTERVAL = 1.2

SOURCES = {
    "Apollo Pharmacy": "aph_search",
    "Tata 1mg": "tmg_search",
    "Netmeds": "nm_search",
}

SOURCE_PARAMS = {
    "Apollo Pharmacy": lambda q: {"query": q, "per_page": 10},
    "Tata 1mg": lambda q: {"query": q, "per_page": 10},
    "Netmeds": lambda q: {"query": q, "per_page": 10},
}

WHO_DATABASE = {
    "telmisartan": {
        "effects": "Used to treat hypertension (high blood pressure) to help prevent future cardiovascular events like heart attacks and strokes. It works by blocking angiotensin II receptors, which relaxes and widens blood vessels.",
        "side_effects": "Dizziness, low blood pressure, sinus inflammation (congestion/sore throat), back pain, and elevated potassium levels (hyperkalemia).",
        "who_reference": "Listed on the WHO Model List of Essential Medicines (Section 12.3: Antihypertensive medicines)"
    },
    "metformin": {
        "effects": "First-line medication for type 2 diabetes mellitus. It helps control blood sugar levels by reducing glucose production in the liver, decreasing glucose absorption in the intestines, and improving insulin sensitivity.",
        "side_effects": "Nausea, vomiting, diarrhea, abdominal discomfort, metallic taste in the mouth, and vitamin B12 deficiency (long-term use).",
        "who_reference": "Listed on the WHO Model List of Essential Medicines (Section 18.5: Medicines used for diabetes)"
    },
    "atorvastatin": {
        "effects": "A statin medication used to prevent cardiovascular disease in high-risk individuals and to lower abnormal cholesterol/lipid levels. It works by inhibiting HMG-CoA reductase, the enzyme responsible for cholesterol production in the liver.",
        "side_effects": "Muscle aches or weakness (myalgia), joint pain, headache, mild digestive issues, and abnormal liver enzyme tests.",
        "who_reference": "Listed on the WHO Model List of Essential Medicines (Section 12.6: Lipid-lowering medicines)"
    },
    "amlodipine": {
        "effects": "A calcium channel blocker used to treat high blood pressure (hypertension) and chest pain (angina). It works by relaxing the smooth muscle of systemic blood vessels, reducing workload on the heart.",
        "side_effects": "Swelling of the ankles or feet (edema), headache, fatigue, dizziness, flushing, and palpitations.",
        "who_reference": "Listed on the WHO Model List of Essential Medicines (Section 12.3: Antihypertensive medicines)"
    },
    "losartan": {
        "effects": "An angiotensin II receptor blocker (ARB) used to treat high blood pressure, protect kidneys in diabetic patients, and decrease stroke risks. It relaxes blood vessels to lower pressure and increase blood flow.",
        "side_effects": "Dizziness, fatigue, low blood pressure, muscle cramps, and high blood potassium levels.",
        "who_reference": "Listed on the WHO Model List of Essential Medicines (Section 12.3: Antihypertensive medicines)"
    }
}


def translate_to_english(text):
    text_stripped = text.strip()
    if any(ord(char) > 127 for char in text_stripped):
        try:
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q={urllib.parse.quote(text_stripped)}"
            r = http_requests.get(url, timeout=5)
            r.raise_for_status()
            res = r.json()
            translated = res[0][0][0]
            if translated:
                return translated.strip()
        except Exception:
            pass
    return text_stripped


def clean_salt_name(salt):
    if not salt:
        return None
    s = salt.lower()
    s = re.sub(r'\b\d+\s*(mg|mcg|ml|g|tablet|tablets|capsule|capsules|%)', '', s)
    s = re.sub(r'[^a-zA-Z\s\-]', ' ', s)
    words = s.split()
    stop_words = {"tablet", "tablets", "capsule", "capsules", "mg", "mcg", "g", "ml", "film", "coated", "extended", "release"}
    words = [w for w in words if w not in stop_words]
    if not words:
        return None
    word = words[0]
    if word == "paracetamol":
        return "acetaminophen"
    if word == "salbutamol":
        return "albuterol"
    return word


def clean_text_formatting(text):
    if not text:
        return ""
    text = re.sub(r'^\d+\s+[A-Z\s&_]+\n+', '', text)
    text = re.sub(r'^\d+\s+[A-Z\s&_]+', '', text)
    return " ".join(text.split())


def fetch_drug_info_from_fda(salt_name):
    clean_name = clean_salt_name(salt_name)
    if not clean_name:
        return None
    try:
        encoded_name = urllib.parse.quote(clean_name)
        url = f"https://api.fda.gov/drug/label.json?search=(openfda.generic_name:%22{encoded_name}%22+OR+openfda.brand_name:%22{encoded_name}%22)&limit=1"
        r = http_requests.get(url, timeout=6)
        if r.status_code == 200:
            res = r.json()
            results = res.get("results", [])
            if results:
                p = results[0]
                effects = p.get("indications_and_usage", [""])[0]
                side_effects = p.get("adverse_reactions", [""])[0]
                if not effects:
                    effects = p.get("description", [""])[0]
                if not side_effects:
                    side_effects = p.get("warnings_and_precautions", [""])[0]
                effects = clean_text_formatting(effects)
                side_effects = clean_text_formatting(side_effects)
                if len(effects) > 300:
                    effects = effects[:297] + "..."
                if len(side_effects) > 300:
                    side_effects = side_effects[:297] + "..."
                return {
                    "effects": effects or "Uses and mechanism details are available at pharmacy counters.",
                    "side_effects": side_effects or "Side effects profile is available at pharmacy counters.",
                    "who_reference": f"Sourced dynamically from FDA Open Data for {clean_name.capitalize()}"
                }
    except Exception:
        pass
    return None


def run_wire(action_slug, params, timeout=POLL_TIMEOUT):
    resp = http_requests.post(
        TASK_URL, headers=HEADERS,
        json={"action_id": action_slug, "params": params},
        timeout=20,
    )
    print(f"[PRICES] run_wire initial response: status={resp.status_code}, body={resp.text[:500]}")
    resp.raise_for_status()
    body = resp.json()
    if body.get("status") == "completed":
        return body.get("data", body)
    job_id = body.get("job_id") or body.get("id")
    if not job_id:
        return body
    deadline = time.time() + timeout
    consecutive_errors = 0
    while time.time() < deadline:
        time.sleep(POLL_INTERVAL)
        try:
            poll = http_requests.get(JOBS_URL.format(job_id), headers=HEADERS, timeout=15)
            poll.raise_for_status()
            pd = poll.json()
            consecutive_errors = 0
            status = pd.get("status", "")
            if status == "completed":
                return pd.get("data", pd)
            if status in ("failed", "error"):
                raise RuntimeError(f"Job {job_id} failed: {pd}")
        except http_requests.exceptions.ConnectionError:
            consecutive_errors += 1
            if consecutive_errors >= 4:
                raise
            time.sleep(1)
            continue
        except http_requests.exceptions.Timeout:
            consecutive_errors += 1
            if consecutive_errors >= 3:
                raise
            continue
    raise TimeoutError(f"Job {job_id} timed out after {timeout}s")


def parse_price(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        v = float(val)
        return v if v > 0 else None
    s = str(val).replace(",", "").replace("₹", "").replace("Rs", "").strip()
    m = re.search(r"\d+\.?\d*", s)
    return float(m.group()) if m else None


def _check_stock(item):
    for key in ("available", "availability", "in_stock", "inStock", "stock_status", "status", "is_available"):
        val = item.get(key)
        if val is None:
            continue
        if isinstance(val, bool):
            return val
        if isinstance(val, (int, float)):
            return val > 0
        s = str(val).strip().lower()
        if s in ("true", "yes", "y", "1", "in-stock", "in_stock", "in stock", "available"):
            return True
        if s in ("false", "no", "n", "0", "out-of-stock", "out_of_stock", "out of stock", "unavailable"):
            return False
    return True


def norm_apollo(data, query):
    items = []
    try:
        inner = data.get("data") or data
        products = inner.get("products") or []
        for p in products[:10]:
            if not isinstance(p, dict):
                continue
            price = parse_price(p.get("specialPrice") or p.get("price"))
            mrp = parse_price(p.get("mrp") or p.get("price"))
            if price is None:
                continue
            items.append({
                "seller": "Apollo Pharmacy",
                "name": p.get("name") or query,
                "price": price,
                "mrp": mrp or price,
                "pack_size": p.get("unitSize") or p.get("packSize") or "",
                "in_stock": _check_stock(p),
                "is_generic": False,
                "salt": p.get("saltComposition") or p.get("salt") or next((t for t in p.get("tags", []) if "fever" not in t.lower() and "pain" not in t.lower() and "cold" not in t.lower()), "").replace("-", " "),
                "url": f"https://www.apollopharmacy.in/otc/{p['urlKey']}" if p.get("urlKey") else "",
            })
    except Exception:
        pass
    return items


def norm_1mg(data, query):
    items = []
    try:
        inner = data.get("data") or data
        products = inner.get("search_results") or inner.get("products") or []
        for p in products[:10]:
            if not isinstance(p, dict):
                continue
            ps = p.get("price_summary") or {}
            price = parse_price(ps.get("discounted_price") or ps.get("mrp"))
            mrp = parse_price(ps.get("mrp"))
            if price is None:
                continue
            qi = p.get("quantity_info") or {}
            pack = str(qi.get("selling_quantity") or "") + " tablets" if qi.get("selling_quantity") else ""
            url_path = p.get("url") or ""
            items.append({
                "seller": "Tata 1mg",
                "name": p.get("name") or query,
                "price": price,
                "mrp": mrp or price,
                "pack_size": pack,
                "in_stock": _check_stock(p),
                "is_generic": "generic" in str(p.get("type", "")).lower(),
                "salt": p.get("compositionTitle") or p.get("salt") or "",
                "url": f"https://www.1mg.com{url_path}" if url_path else "https://www.1mg.com",
            })
    except Exception:
        pass
    return items


def _extract_items(data, *keys):
    if isinstance(data, list):
        return data
    if not isinstance(data, dict):
        return []
    for key in keys:
        val = data.get(key)
        if isinstance(val, list):
            return val
        if isinstance(val, dict):
            for v in val.values():
                if isinstance(v, list):
                    return v
                if isinstance(v, dict):
                    sub = _extract_items(v, *keys)
                    if sub:
                        return sub
    return []


def norm_netmeds(data, query):
    items = []
    try:
        inner = data.get("data") or data
        products = inner.get("items") or inner.get("products") or []
        for p in products[:10]:
            if not isinstance(p, dict):
                continue
            price = parse_price(
                p.get("price") or p.get("selling_price") or p.get("special_price")
            )
            mrp = parse_price(p.get("mrp") or p.get("original_price"))
            if price is None:
                continue
            items.append({
                "seller": "Netmeds",
                "name": p.get("name") or p.get("product_name") or query,
                "price": price,
                "mrp": mrp or price,
                "pack_size": p.get("pack_size") or p.get("packing_info") or "",
                "in_stock": _check_stock(p),
                "is_generic": False,
                "salt": p.get("salt") or p.get("composition") or (p.get("attributes") or {}).get("genericname") or (p.get("attributes") or {}).get("genericnamewithdosage") or (p.get("attributes") or {}).get("ingredients") or "",
                "url": f"https://www.netmeds.com/product/{p['slug']}" if p.get("slug") else "",
            })
    except Exception:
        pass
    return items


NORMALIZERS = {
    "Apollo Pharmacy": norm_apollo,
    "Tata 1mg": norm_1mg,
    "Netmeds": norm_netmeds,
}


def query_source(name, slug, medicine_name):
    try:
        params = SOURCE_PARAMS[name](medicine_name)
        print(f"[PRICES] Querying {name} with slug={slug}, params={params}")
        raw = run_wire(slug, params, timeout=28)
        print(f"[PRICES] Raw response from {name}: {raw}")
        results = NORMALIZERS[name](raw, medicine_name)
        if results:
            return name, results, f"found {len(results)} results"
        return name, [], "no results"
    except Exception as e:
        print(f"[PRICES] Error querying {name}: {e}")
        return name, [], f"error: {str(e)[:120]}"


def compute_savings(results, current_price):
    if not results:
        return {"headline_savings": 0, "savings_pct": 0, "baseline": current_price,
                "cheapest": None, "cheapest_seller": None, "cheapest_name": None}
    prices = [r["price"] for r in results if r.get("price")]
    if not prices:
        return {"headline_savings": 0, "savings_pct": 0, "baseline": current_price,
                "cheapest": None, "cheapest_seller": None, "cheapest_name": None}
    cheapest = min(prices)
    cheapest_item = next(r for r in results if r["price"] == cheapest)
    if current_price and current_price > 0:
        baseline = current_price
    else:
        branded = [r["price"] for r in results if not r.get("is_generic")]
        baseline = max(branded) if branded else max(prices)
    savings = round(max(baseline - cheapest, 0), 2)
    pct = round((savings / baseline) * 100, 1) if baseline > 0 else 0
    return {
        "headline_savings": savings,
        "savings_pct": pct,
        "baseline": round(baseline, 2),
        "cheapest": cheapest,
        "cheapest_seller": cheapest_item["seller"],
        "cheapest_name": cheapest_item["name"],
    }


def extract_salt(results):
    for r in results:
        s = (r.get("salt") or "").strip()
        if s and len(s) > 3:
            return s
    return None


def _save_prices(results, medicine_name):
    for r in results:
        try:
            supabase.table("scraped_prices").insert({
                "medicine_name": medicine_name,
                "seller": r.get("seller", ""),
                "price": r.get("price"),
                "mrp": r.get("mrp"),
                "pack_size": r.get("pack_size", ""),
                "in_stock": r.get("in_stock", True),
                "url": r.get("url", ""),
            }).execute()
        except Exception:
            pass


@prices_bp.route("/api/prices/search", methods=["POST"])
def search_prices_live():
    data = request.get_json(silent=True) or {}
    raw_medicine_name = (data.get("medicine_name") or "").strip()
    current_price = data.get("current_price")

    if not raw_medicine_name:
        return jsonify({"error": "medicine_name is required"}), 400
    if not ANAKIN_API_KEY or ANAKIN_API_KEY == "ak-your-api-key":
        return jsonify({"error": "Anakin API key not configured"}), 500

    medicine_name = translate_to_english(raw_medicine_name)

    try:
        current_price = float(current_price) if current_price else None
    except (ValueError, TypeError):
        current_price = None

    all_results = []
    site_statuses = {}
    sites_used = []
    sites_skipped = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
        futures = {
            ex.submit(query_source, name, slug, medicine_name): name
            for name, slug in SOURCES.items()
        }
        for future in concurrent.futures.as_completed(futures, timeout=70):
            name, results, status = future.result()
            site_statuses[name] = status
            if results:
                all_results.extend(results)
                sites_used.append(name)
            else:
                sites_skipped.append(name)

    all_results.sort(key=lambda x: x.get("price") or 9999)

    if all_results:
        all_results[0]["is_best"] = True

    salt_name = extract_salt(all_results)
    savings = compute_savings(all_results, current_price)

    medicine_info = None
    if salt_name:
        medicine_info = fetch_drug_info_from_fda(salt_name)
    if not medicine_info and medicine_name:
        medicine_info = fetch_drug_info_from_fda(medicine_name)
    if not medicine_info:
        lookup_keys = []
        if salt_name:
            lookup_keys.append(salt_name.lower())
        if medicine_name:
            lookup_keys.append(medicine_name.lower())
        for k in lookup_keys:
            for db_key, db_val in WHO_DATABASE.items():
                if db_key in k:
                    medicine_info = db_val
                    break
            if medicine_info:
                break

    _save_prices(all_results, medicine_name)

    response = {
        "medicine_name": medicine_name,
        "original_name": raw_medicine_name,
        "salt_name": salt_name,
        "medicine_info": medicine_info,
        "savings": savings,
        "results": all_results,
        "site_statuses": site_statuses,
        "sites_used": sites_used,
        "sites_skipped": sites_skipped,
        "timestamp": int(time.time()),
    }
    
    # Add debug info if no results
    if not all_results:
        response["debug"] = "No results from any source. Check server logs for Anakin API responses."
    
    return jsonify(response)


@prices_bp.route("/api/prices", methods=["GET"])
def list_prices():
    medicine_name = request.args.get("medicine_name", "").strip()
    if not medicine_name:
        return jsonify({"error": "medicine_name is required"}), 400
    try:
        result = (
            supabase.table("scraped_prices")
            .select("*")
            .ilike("medicine_name", f"%{medicine_name}%")
            .order("price")
            .execute()
        )
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
