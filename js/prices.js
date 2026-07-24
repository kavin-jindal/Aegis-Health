/* ── PRICES (Panacea-style Wire integration) ── */
const PRICE_STORES = [
  { name: "Apollo Pharmacy", color: "#c0392b", urlBase: "https://www.apollopharmacy.in/search-medicines/" },
  { name: "Tata 1mg", color: "#1f6fb2", urlBase: "https://www.1mg.com/search/all?name=" },
  { name: "Netmeds", color: "#d98324", urlBase: "https://www.netmeds.com/catalogsearch/result?q=" },
];
let priceCart = JSON.parse(localStorage.getItem("aegisPriceCart") || "[]");
let priceLastQuery = "";
let priceLastData = null;

function quickSearchPrice(med) {
  document.getElementById("price-search").value = med;
  searchPricesWire();
}

function priceShowLoading(on) {
  const btn = document.getElementById("price-search-btn");
  btn.disabled = on;
  btn.textContent = on ? "searching…" : "Compare Prices →";
  document.getElementById("price-loading").classList.toggle("active", on);
}

function priceShowError(msg) {
  const el = document.getElementById("price-error");
  el.classList.add("active");
  document.getElementById("price-error-msg").textContent = msg;
}

function priceUpdateCartCount() {
  document.getElementById("price-cart-count").textContent = priceCart.length;
}

async function searchPricesWire() {
  const q = document.getElementById("price-search").value.trim();
  if (!q) return;
  if (q === priceLastQuery && document.getElementById("price-results").classList.contains("active")) return;
  priceLastQuery = q;

  document.getElementById("price-results").classList.remove("active");
  document.getElementById("price-error").classList.remove("active");
  priceShowLoading(true);

  try {
    const res = await fetch("/api/prices/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicine_name: q }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "HTTP " + res.status);
    }
    const data = await res.json();
    priceLastData = data;
    renderPriceResults(data);
  } catch (err) {
    priceShowError(err.message || "Network error.");
  } finally {
    priceShowLoading(false);
  }
}

function renderPriceResults(data) {
  const results = data.results || [];

  if (data.original_name && data.medicine_name && data.original_name.toLowerCase() !== data.medicine_name.toLowerCase()) {
    document.getElementById("price-res-name").innerHTML = esc(data.original_name) + ' <span style="font-size:0.9rem;color:var(--text-dim);font-weight:400;">(' + esc(data.medicine_name) + ')</span>';
  } else {
    document.getElementById("price-res-name").textContent = data.medicine_name || priceLastQuery;
  }

  const bestPrice = results.reduce((min, r) => (r.price && r.price < min ? r.price : min), Infinity);
  let metaText = results.length + " listing" + (results.length !== 1 ? "s" : "") + " found";
  if (bestPrice < Infinity) metaText += " \u00b7 from \u20b9" + Number(bestPrice).toLocaleString("en-IN");
  document.getElementById("price-res-meta").textContent = metaText;

  // Monograph
  const salt = data.salt_name || "";
  let monoHtml =
    '<div class="pm-field"><div class="k">Composition</div><div class="v">' + esc(salt || data.medicine_name || "") + '</div></div>' +
    '<div class="pm-field"><div class="k">Results</div><div class="v">' + results.length + " listing" + (results.length !== 1 ? "s" : "") + '</div></div>';
  if (data.medicine_info) {
    const info = data.medicine_info;
    monoHtml +=
      '<div style="width:100%;border-top:1px dashed rgba(143,174,139,0.15);margin:10px 0 6px;padding-top:10px;"></div>' +
      '<div class="pm-field" style="width:100%;"><div class="k">Uses & Effects (FDA / WHO)</div><div class="v pm-wide">' + esc(info.effects) + '</div></div>' +
      '<div class="pm-field" style="width:100%;margin-top:8px;"><div class="k">Common Side Effects</div><div class="v pm-wide">' + esc(info.side_effects) + '</div></div>' +
      '<div style="width:100%;font-size:0.68rem;color:var(--sage);margin-top:8px;font-weight:500;">\u2713 ' + esc(info.who_reference) + '</div>';
  }
  document.getElementById("price-monograph").innerHTML = monoHtml;

  // Summary strip
  const inStock = results.filter(r => r.in_stock);
  const cheapest = inStock.length ? inStock.reduce((a, b) => (a.price || 9999) < (b.price || 9999) ? a : b) : null;
  const priciest = inStock.length ? inStock.reduce((a, b) => (a.price || 0) > (b.price || 0) ? a : b) : null;
  const savings = (cheapest && priciest && priciest.price > cheapest.price) ? priciest.price - cheapest.price : 0;

  if (cheapest) {
    let txt = 'Cheapest \u2014 <strong>' + esc(cheapest.name) + '</strong> at <strong>' + esc(cheapest.seller) + '</strong>, \u20b9' + Number(cheapest.price).toLocaleString("en-IN") + " per pack";
    if (savings > 0) txt += '<span style="margin-left:auto;">save \u20b9' + Number(savings).toLocaleString("en-IN") + " vs priciest</span>";
    document.getElementById("price-summary").innerHTML = txt;
  } else {
    document.getElementById("price-summary").innerHTML = "No pharmacy currently has this in stock";
  }

  // Store grid
  const grid = document.getElementById("price-store-grid");
  grid.innerHTML = "";

  PRICE_STORES.forEach(store => {
    const storeResults = results.filter(r => r.seller === store.name);
    const col = document.createElement("div");
    col.className = "ps-col";
    col.style.setProperty("--ps-color", store.color);

    const buyUrl = store.urlBase + encodeURIComponent(data.medicine_name || priceLastQuery);

    const rows = storeResults.map(r => {
      const isBest = cheapest && r === cheapest;
      const stockClass = r.in_stock ? "in" : "out";
      const stockLabel = r.in_stock ? "IN STOCK" : "OUT OF STOCK";
      const linkUrl = r.url || buyUrl;
      const id = r.name + "|" + r.seller + "|" + r.price + "|" + (r.pack_size || "");
      const inCart = priceCart.some(c => c.id === id);

      return '<div class="ps-listing' + (isBest ? " ps-best" : "") + (r.in_stock ? "" : " ps-out") + '">' +
        (isBest ? '<div class="ps-best-badge">BEST</div>' : "") +
        '<div class="ps-brand">' + esc(r.name) + "</div>" +
        (r.is_generic ? '<div class="ps-generic">Generic</div>' : "") +
        '<div class="ps-price-row">' +
          (r.mrp && r.mrp !== r.price ? '<div class="ps-mrp">\u20b9' + Number(r.mrp).toLocaleString("en-IN") + "</div>" : "") +
          '<div class="ps-price">' + (r.price ? "\u20b9" + Number(r.price).toLocaleString("en-IN") : "\u2014") + "</div>" +
        "</div>" +
        '<div class="ps-pack">' + esc(r.pack_size || "") + "</div>" +
        '<div class="ps-foot">' +
          '<span class="ps-stock ' + stockClass + '">' + stockLabel + "</span>" +
          '<div class="ps-actions">' +
            '<button class="ps-add-cart' + (inCart ? " added" : "") + '" data-name="' + esc(r.name) + '" data-seller="' + esc(r.seller) + '" data-price="' + (r.price || 0) + '" data-pack="' + esc(r.pack_size || "") + '" data-url="' + esc(linkUrl) + '">' + (inCart ? "ADDED" : "ADD TO CART") + '</button>' +
            '<a class="ps-buy" href="' + esc(linkUrl) + '" target="_blank" rel="noopener">BUY \u2197</a>' +
          "</div>" +
        "</div>" +
      "</div>";
    }).join("");

    col.innerHTML =
      '<div class="ps-head"><span class="ps-dot"></span><span class="ps-name">' + esc(store.name) + '</span><span class="ps-count">' + storeResults.length + " option" + (storeResults.length !== 1 ? "s" : "") + '</span></div>' +
      (rows || '<div class="ps-empty">No results from this pharmacy</div>');

    grid.appendChild(col);
  });

  // Attach cart handlers
  grid.querySelectorAll(".ps-add-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.name + "|" + btn.dataset.seller + "|" + btn.dataset.price + "|" + btn.dataset.pack;
      if (priceCart.some(c => c.id === id)) return;
      priceCart.push({ id, name: btn.dataset.name, seller: btn.dataset.seller, price: Number(btn.dataset.price), pack: btn.dataset.pack, url: btn.dataset.url });
      localStorage.setItem("aegisPriceCart", JSON.stringify(priceCart));
      priceUpdateCartCount();
      btn.textContent = "ADDED";
      btn.classList.add("added");
    });
  });

  document.getElementById("price-results").classList.add("active");
}

// Cart modal
function openPriceCart() {
  if (!document.getElementById("price-cart-overlay")) {
    createPriceCartModal();
  }
  renderPriceCartModal();
  document.getElementById("price-cart-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}
function closePriceCart() {
  const overlay = document.getElementById("price-cart-overlay");
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
}

function createPriceCartModal() {
  const overlay = document.createElement("div");
  overlay.id = "price-cart-overlay";
  overlay.className = "price-cart-overlay";
  overlay.innerHTML = '<div class="price-cart-modal"><div class="price-cart-header"><h2>Your Cart</h2><button class="price-cart-close" onclick="closePriceCart()">&times;</button></div><div id="price-cart-items" class="price-cart-items"><div class="price-cart-empty">Your cart is empty</div></div><div class="price-cart-footer"><div class="price-cart-total" id="price-cart-total">\u2014</div><div class="price-cart-actions"><button class="btn btn-secondary" onclick="clearPriceCart()">Clear</button><button class="btn btn-primary" onclick="exportPriceCartPdf()">Export PDF</button></div></div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener("click", e => {
    if (e.target.id === "price-cart-overlay") closePriceCart();
  });
}

function renderPriceCartModal() {
  const el = document.getElementById("price-cart-items");
  if (!priceCart.length) {
    el.innerHTML = '<div class="price-cart-empty">Your cart is empty</div>';
    document.getElementById("price-cart-total").textContent = "\u2014";
    return;
  }
  let html = "", total = 0;
  priceCart.forEach(c => {
    total += c.price || 0;
    html += '<div class="pc-item"><div class="pc-item-info"><div class="pc-item-name">' + esc(c.name) + '</div><div class="pc-item-meta">' + esc(c.pack) + ' \u00b7 ' + esc(c.seller) + '</div></div><div class="pc-item-price">\u20b9' + Number(c.price).toLocaleString("en-IN") + '</div><button class="pc-item-remove" data-id="' + esc(c.id) + '">&times;</button></div>';
  });
  el.innerHTML = html;
  document.getElementById("price-cart-total").textContent = "Total: \u20b9" + total.toLocaleString("en-IN");
  el.querySelectorAll(".pc-item-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      priceCart = priceCart.filter(c => c.id !== btn.dataset.id);
      localStorage.setItem("aegisPriceCart", JSON.stringify(priceCart));
      priceUpdateCartCount();
      renderPriceCartModal();
    });
  });
}

function clearPriceCart() {
  priceCart = [];
  localStorage.setItem("aegisPriceCart", JSON.stringify(priceCart));
  priceUpdateCartCount();
  renderPriceCartModal();
}

function exportPriceCartPdf() {
  if (!priceCart.length) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210, margin = 16, colW = [10, 68, 38, 30, 40];
  doc.setFillColor(26, 46, 31); doc.rect(0, 0, pageW, 297, "F");
  const headY = 14;
  doc.setTextColor(245, 239, 230); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("Aegis", margin, headY + 4);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(155, 168, 154);
  doc.text("Medicine Cart Summary", margin, headY + 11);
  doc.setDrawColor(143, 174, 139); doc.setLineWidth(0.5);
  doc.line(margin, headY + 16, pageW - margin, headY + 16);

  function drawHeader(y) {
    doc.setFillColor(143, 174, 139); doc.rect(margin, y, pageW - 2 * margin, 8, "F");
    doc.setTextColor(26, 46, 31); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    let x = margin + 2;
    doc.text("#", x, y + 6); doc.text("Medicine", x + colW[0], y + 6);
    doc.text("Store", x + colW[0] + colW[1], y + 6); doc.text("Price", x + colW[0] + colW[1] + colW[2], y + 6);
    doc.text("Buy Link", x + colW[0] + colW[1] + colW[2] + colW[3], y + 6);
    return y + 12;
  }

  let y = drawHeader(headY + 20);
  let grandTotal = 0;
  priceCart.forEach((c, i) => {
    const rowH = 8;
    if (y + rowH > 275) { doc.addPage(); doc.setFillColor(26, 46, 31); doc.rect(0, 0, pageW, 297, "F"); y = drawHeader(margin); }
    grandTotal += c.price || 0;
    if (i % 2 === 0) { doc.setFillColor(30, 52, 36); doc.rect(margin, y - 2, pageW - 2 * margin, rowH + 2, "F"); }
    doc.setTextColor(245, 239, 230); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    let x = margin + 2;
    doc.text(String(i + 1), x, y + 5); doc.text(c.name, x + colW[0], y + 5);
    doc.text(c.seller, x + colW[0] + colW[1], y + 5); doc.text("Rs. " + c.price, x + colW[0] + colW[1] + colW[2], y + 5);
    const linkX = x + colW[0] + colW[1] + colW[2] + colW[3];
    doc.setTextColor(143, 174, 139); doc.textWithLink("Buy", linkX, y + 5, { url: c.url });
    y += rowH + 2;
  });
  y += 4;
  doc.setDrawColor(143, 174, 139); doc.setLineWidth(0.6); doc.line(margin, y - 2, pageW - margin, y - 2);
  doc.setTextColor(245, 239, 230); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.text("Grand Total: Rs. " + grandTotal.toLocaleString("en-IN"), margin, y + 5);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(107, 122, 106);
  doc.text("Aegis Health \u00b7 prices indicative, verify at checkout", margin, 285);
  doc.save("aegis-cart.pdf");
}

priceUpdateCartCount();
