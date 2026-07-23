import io
from flask import Blueprint, request, jsonify, send_file, render_template_string
import qrcode
from db import supabase

emergency_bp = Blueprint("emergency", __name__)

EMERGENCY_PAGE_HTML = """<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Emergency Info — {{ name }}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#fff;color:#1a1a2e;padding:32px;max-width:480px;margin:0 auto}
  h1{font-size:1.4rem;margin-bottom:6px}
  .sub{color:#888;font-size:0.9rem;margin-bottom:24px}
  .field{margin-bottom:16px}
  .label{font-size:0.75rem;text-transform:uppercase;color:#e94560;font-weight:600;letter-spacing:0.5px;margin-bottom:4px}
  .value{font-size:1rem;line-height:1.5}
  .emergency-box{background:#fff3f5;border:2px solid #e94560;border-radius:10px;padding:20px;margin-top:24px}
  .emergency-box h2{color:#e94560;font-size:1rem;margin-bottom:12px}
  .no-data{color:#999;font-style:italic}
</style></head><body>
<h1>{{ name }}</h1>
<div class="sub">Emergency medical information</div>
{% if blood_group %}
<div class="field"><div class="label">Blood Group</div><div class="value">{{ blood_group }}</div></div>
{% endif %}
{% if allergies %}
<div class="field"><div class="label">Allergies</div><div class="value">{{ allergies }}</div></div>
{% endif %}
{% if conditions %}
<div class="field"><div class="label">Medical Conditions</div><div class="value">{{ conditions }}</div></div>
{% endif %}
{% if not blood_group and not allergies and not conditions %}
<p class="no-data">No emergency info recorded yet.</p>
{% endif %}
{% if emergency_contact_name or emergency_contact_phone %}
<div class="emergency-box">
  <h2>Emergency Contact</h2>
  {% if emergency_contact_name %}<div class="field"><div class="label">Name</div><div class="value">{{ emergency_contact_name }}</div></div>{% endif %}
  {% if emergency_contact_phone %}<div class="field"><div class="label">Phone</div><div class="value"><a href="tel:{{ emergency_contact_phone }}">{{ emergency_contact_phone }}</a></div></div>{% endif %}
</div>
{% endif %}
</body></html>"""


@emergency_bp.route("/emergency/<uuid:family_member_id>")
def public_emergency_page(family_member_id):
    try:
        member = (
            supabase.table("family_members")
            .select("name")
            .eq("id", str(family_member_id))
            .single()
            .execute()
        )
        info = (
            supabase.table("emergency_info")
            .select("*")
            .eq("family_member_id", str(family_member_id))
            .maybe_single()
            .execute()
        )
        data = info.data if info and info.data else {}
        return render_template_string(
            EMERGENCY_PAGE_HTML,
            name=member.data["name"] if member and member.data else "Unknown",
            blood_group=data.get("blood_group") or "",
            allergies=data.get("allergies") or "",
            conditions=data.get("conditions") or "",
            emergency_contact_name=data.get("emergency_contact_name") or "",
            emergency_contact_phone=data.get("emergency_contact_phone") or "",
        )
    except Exception:
        return "Emergency info not available", 404


@emergency_bp.route("/api/emergency/qr/<uuid:family_member_id>")
def generate_qr(family_member_id):
    try:
        info = (
            supabase.table("emergency_info")
            .select("id")
            .eq("family_member_id", str(family_member_id))
            .maybe_single()
            .execute()
        )
        if not info or not info.data:
            return jsonify({"error": "No emergency info found for this member"}), 404
        url = f"/emergency/{family_member_id}"
        img = qrcode.make(url)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return send_file(buf, mimetype="image/png")
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@emergency_bp.route("/api/emergency", methods=["GET"])
def get_emergency_info():
    family_member_id = request.args.get("family_member_id")
    if not family_member_id:
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        result = (
            supabase.table("emergency_info")
            .select("*")
            .eq("family_member_id", family_member_id)
            .maybe_single()
            .execute()
        )
        return jsonify(result.data if result and result.data else {}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@emergency_bp.route("/api/emergency", methods=["POST"])
def upsert_emergency_info():
    data = request.get_json(silent=True) or {}
    if not data.get("family_member_id"):
        return jsonify({"error": "family_member_id is required"}), 400
    try:
        existing = (
            supabase.table("emergency_info")
            .select("id")
            .eq("family_member_id", data["family_member_id"])
            .maybe_single()
            .execute()
        )
        payload = {
            "family_member_id": data["family_member_id"],
            "blood_group": data.get("blood_group"),
            "allergies": data.get("allergies"),
            "conditions": data.get("conditions"),
            "emergency_contact_name": data.get("emergency_contact_name"),
            "emergency_contact_phone": data.get("emergency_contact_phone"),
        }
        if existing and existing.data:
            result = (
                supabase.table("emergency_info")
                .update(payload)
                .eq("id", existing.data["id"])
                .execute()
            )
        else:
            result = (
                supabase.table("emergency_info")
                .insert(payload)
                .execute()
            )
        return jsonify(result.data[0]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
