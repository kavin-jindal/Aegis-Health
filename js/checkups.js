/* ── CHECKUPS ── */
let checkupsCache = [];
async function loadCheckups() {
  const el = document.getElementById("checkups-list");
  if (!selectedFamilyId) { el.innerHTML=""; return; }
  el.innerHTML='<div class="state-box state-loading"><p>Loading…</p></div>';
  try {
    const res = await fetch("/api/checkups?family_member_id="+selectedFamilyId);
    if (!res.ok) throw new Error();
    checkupsCache = await res.json();
    renderCheckups(); loadCheckupDoctors(); renderCheckupCalendar();
  } catch(err) {
    el.innerHTML='<div class="state-box state-error"><p>Failed to load checkups.</p></div>';
  }
}
async function loadCheckupDoctors() {
  const sel = document.getElementById("cup-doctor");
  const prev = sel.value;
  sel.innerHTML='<option value="">None</option>';
  if (!selectedFamilyId) return;
  try {
    const res = await fetch("/api/doctors?family_member_id="+selectedFamilyId);
    if (!res.ok) throw new Error();
    const docs = await res.json();
    docs.forEach(d=>{ const o=document.createElement("option"); o.value=d.id; o.textContent=d.name; sel.appendChild(o); });
    sel.value = prev;
  } catch(err) {}
  const existing = sel.querySelector('option[value="__add_new__"]');
  if (existing) existing.remove();
  const addOpt = document.createElement("option");
  addOpt.value = "__add_new__";
  addOpt.textContent = "\uff0b Add New Doctor";
  addOpt.style.fontWeight = "600";
  addOpt.style.color = "var(--sage)";
  sel.appendChild(addOpt);
  sel.onchange = function() {
    if (this.value === "__add_new__") {
      this.value = prev || "";
      closeModal("modal-checkup");
      openDoctorModal();
    }
  };
}
function renderCheckups() {
  const el = document.getElementById("checkups-list");
  document.getElementById("cup-count").textContent = checkupsCache.length;
  if (!checkupsCache.length) {
    el.innerHTML='<div class="state-box state-empty"><p>No checkups recorded yet.</p></div>';
    return;
  }
  el.innerHTML = '<ul class="data-list">' + checkupsCache.map(c=>{
    const docName = c.doctors ? c.doctors.name : "";
    const parts   = [c.checkup_date, docName ? "Dr. "+esc(docName) : ""].filter(Boolean);
    const fuBadge = c.follow_up_date
      ? `<span class="badge badge-amber" style="margin-left:6px">Follow-up: ${esc(c.follow_up_date)}</span>` : "";
    return `
    <li class="data-item">
      <div class="item-icon ii-sage">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
      </div>
      <div class="data-item-body" onclick="showItemDetail('checkup','${c.id}')" style="cursor:pointer">
        <div class="di-title">${esc(c.diagnosis||"No diagnosis")} ${fuBadge}</div>
        <div class="di-meta">${parts.join(" \u00b7 ")}</div>
        ${c.notes?'<div class="di-meta">'+esc(c.notes)+'</div>':""}
      </div>
      <div class="data-item-actions">
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();editCheckup('${c.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteCheckup('${c.id}')">Delete</button>
      </div>
    </li>`;
  }).join("") + '</ul>';
}
async function saveCheckup() {
  const editId = document.getElementById("cup-edit-id").value;
  const body = {
    family_member_id: selectedFamilyId,
    checkup_date:   document.getElementById("cup-date").value,
    doctor_id:      document.getElementById("cup-doctor").value||null,
    diagnosis:      document.getElementById("cup-diagnosis").value.trim()||null,
    notes:          document.getElementById("cup-notes").value.trim()||null,
    follow_up_date: document.getElementById("cup-followup").value||null,
  };
  if (!body.checkup_date) { document.getElementById("cup-form-err").textContent="Date required."; return; }
  document.getElementById("cup-form-err").textContent="";
  try {
    const res = await fetch(editId?"/api/checkups/"+editId:"/api/checkups",
      {method:editId?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    if (!res.ok) throw new Error();
    toast(editId?"Checkup updated.":"Checkup added.","ok");
    clearCheckupForm(); loadCheckups();
  } catch(err) {
    document.getElementById("cup-form-err").textContent="Save failed.";
    toast("Failed to save checkup.","err");
  }
}
function editCheckup(id) { openCheckupModal(id); }
async function deleteCheckup(id) {
  if (!confirm("Delete this checkup?")) return;
  try {
    const res = await fetch("/api/checkups/"+id,{method:"DELETE"});
    if (!res.ok) throw new Error();
    if (document.getElementById("cup-edit-id").value===id) clearCheckupForm();
    toast("Checkup deleted.","ok"); loadCheckups();
  } catch(err) { toast("Failed to delete checkup.","err"); }
}
function clearCheckupForm() {
  ["cup-edit-id","cup-date","cup-doctor","cup-diagnosis","cup-notes","cup-followup"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("cup-form-err").textContent="";
  document.getElementById("cup-save-btn").textContent   = "Add Checkup";
  document.getElementById("cup-form-title").textContent = "Add Checkup";
}

/* ── CHECKUP CALENDAR ── */
let calYear, calMonth;
function renderCheckupCalendar() {
  if (calYear === undefined) { var now = new Date(); calYear = now.getFullYear(); calMonth = now.getMonth(); }
  var grid = document.getElementById("cal-grid");
  var title = document.getElementById("cal-month-title");
  var panel = document.getElementById("checkup-calendar-panel");
  if (!grid || !title || !panel) return;
  panel.style.display = "";
  var monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  title.textContent = monthNames[calMonth] + " " + calYear;
  var firstDay = new Date(calYear, calMonth, 1).getDay();
  var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  var today = new Date().toISOString().slice(0, 10);
  var checkupDates = new Set();
  var followupDates = new Set();
  checkupsCache.forEach(c => { if (c.checkup_date) checkupDates.add(c.checkup_date); if (c.follow_up_date) followupDates.add(c.follow_up_date); });
  var html = "";
  for (var i = 0; i < firstDay; i++) html += '<div class="cal-day"></div>';
  for (var d = 1; d <= daysInMonth; d++) {
    var dateStr = calYear + "-" + String(calMonth + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    var cls = "cal-day";
    if (dateStr === today) cls += " today";
    var dots = "";
    if (checkupDates.has(dateStr) || followupDates.has(dateStr)) {
      dots = '<div class="cal-dots">';
      if (checkupDates.has(dateStr)) dots += '<span class="cal-dot cal-dot-checkup"></span>';
      if (followupDates.has(dateStr)) dots += '<span class="cal-dot cal-dot-followup"></span>';
      dots += '</div>';
    }
    html += '<div class="' + cls + '" onclick="filterCheckupsByDate(\'' + dateStr + '\')">' + d + dots + '</div>';
  }
  grid.innerHTML = html;
}
function changeCalMonth(delta) {
  calMonth += delta;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCheckupCalendar();
}
function filterCheckupsByDate(dateStr) {
  var items = document.querySelectorAll("#checkups-list .data-item");
  items.forEach(item => item.style.background = "");
  checkupsCache.forEach((c, i) => {
    if (c.checkup_date === dateStr) {
      var el = items[i];
      if (el) {
        el.style.background = "rgba(143,174,139,0.15)";
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => { el.style.background = ""; }, 2500);
      }
    }
  });
}

/* ── CHECKUP DOCUMENTS & PAYMENTS ── */
function openCheckupDocumentModal(checkupId) {
  let modal = document.getElementById("modal-checkup-doc");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-checkup-doc";
    modal.className = "modal-overlay";
    modal.innerHTML = '<div class="modal-box"><div class="modal-head"><h3>Upload Document</h3><button class="modal-close" onclick="closeModal(\'modal-checkup-doc\')">&times;</button></div>' +
      '<input type="hidden" id="cup-doc-checkup-id" value="">' +
      '<div class="fg"><label for="cup-doc-title">Title</label><input type="text" id="cup-doc-title" placeholder="e.g. Lab Report, Prescription"></div>' +
      '<div class="fg"><label for="cup-doc-file">File <span style="text-transform:none;font-weight:400;color:var(--text-dim)">(PDF, JPG, PNG, WebP, DOC, DOCX - max 20 MB)</span></label>' +
      '<input type="file" id="cup-doc-file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"></div>' +
      '<div class="form-err" id="cup-doc-err"></div>' +
      '<div class="form-actions"><button class="btn btn-primary btn-full" onclick="uploadCheckupDocument()">Upload</button>' +
      '<button class="btn btn-secondary" onclick="closeModal(\'modal-checkup-doc\')">Cancel</button></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener("click", function(e) { if (e.target === modal) closeModal("modal-checkup-doc"); });
  }
  document.getElementById("cup-doc-checkup-id").value = checkupId;
  document.getElementById("cup-doc-title").value = "";
  document.getElementById("cup-doc-file").value = "";
  document.getElementById("cup-doc-err").textContent = "";
  openModal("modal-checkup-doc");
}

async function uploadCheckupDocument() {
  const checkupId = document.getElementById("cup-doc-checkup-id").value;
  const file = document.getElementById("cup-doc-file").files[0];
  const title = document.getElementById("cup-doc-title").value.trim();
  const errEl = document.getElementById("cup-doc-err");
  if (!file) { errEl.textContent = "Please select a file"; return; }
  errEl.textContent = "";
  const fd = new FormData();
  fd.append("file", file);
  if (title) fd.append("title", title);
  try {
    const res = await fetch("/api/checkups/" + checkupId + "/documents", { method: "POST", body: fd });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Upload failed"); }
    toast("Document uploaded.", "ok");
    closeModal("modal-checkup-doc");
    loadCheckups();
  } catch (e) {
    errEl.textContent = e.message || "Upload failed";
    toast("Upload failed.", "err");
  }
}

async function deleteCheckupDocument(checkupId, docId) {
  if (!confirm("Delete this document?")) return;
  try {
    const res = await fetch("/api/checkups/" + checkupId + "/documents/" + docId, { method: "DELETE" });
    if (!res.ok) throw new Error();
    toast("Document deleted.", "ok");
    loadCheckups();
  } catch (e) {
    toast("Failed to delete document.", "err");
  }
}

function openCheckupPaymentModal(checkupId) {
  let modal = document.getElementById("modal-checkup-payment");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-checkup-payment";
    modal.className = "modal-overlay";
    modal.innerHTML = '<div class="modal-box"><div class="modal-head"><h3>Add Payment</h3><button class="modal-close" onclick="closeModal(\'modal-checkup-payment\')">&times;</button></div>' +
      '<input type="hidden" id="cup-pay-checkup-id" value="">' +
      '<div class="fg"><label for="cup-pay-amount">Amount (\u20b9) *</label><input type="number" id="cup-pay-amount" placeholder="0.00" step="0.01" min="0"></div>' +
      '<div class="fg"><label for="cup-pay-method">Payment Method</label><select id="cup-pay-method"><option value="">Select</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Insurance">Insurance</option><option value="Other">Other</option></select></div>' +
      '<div class="fg"><label for="cup-pay-date">Date *</label><input type="date" id="cup-pay-date" value=""></div>' +
      '<div class="fg"><label for="cup-pay-notes">Notes</label><input type="text" id="cup-pay-notes" placeholder="Optional notes"></div>' +
      '<div class="form-err" id="cup-pay-err"></div>' +
      '<div class="form-actions"><button class="btn btn-primary btn-full" onclick="saveCheckupPayment()">Add Payment</button>' +
      '<button class="btn btn-secondary" onclick="closeModal(\'modal-checkup-payment\')">Cancel</button></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener("click", function(e) { if (e.target === modal) closeModal("modal-checkup-payment"); });
  }
  document.getElementById("cup-pay-checkup-id").value = checkupId;
  document.getElementById("cup-pay-amount").value = "";
  document.getElementById("cup-pay-method").value = "";
  document.getElementById("cup-pay-date").value = new Date().toISOString().slice(0, 10);
  document.getElementById("cup-pay-notes").value = "";
  document.getElementById("cup-pay-err").textContent = "";
  openModal("modal-checkup-payment");
}

async function saveCheckupPayment() {
  const checkupId = document.getElementById("cup-pay-checkup-id").value;
  const amount = document.getElementById("cup-pay-amount").value;
  const payment_method = document.getElementById("cup-pay-method").value;
  const payment_date = document.getElementById("cup-pay-date").value;
  const notes = document.getElementById("cup-pay-notes").value.trim();
  const errEl = document.getElementById("cup-pay-err");
  if (!amount || !payment_date) { errEl.textContent = "Amount and date are required"; return; }
  errEl.textContent = "";
  try {
    const res = await fetch("/api/checkups/" + checkupId + "/payments", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ family_member_id: selectedFamilyId, amount: parseFloat(amount), payment_method, payment_date, notes })
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Save failed"); }
    toast("Payment added.", "ok");
    closeModal("modal-checkup-payment");
    loadCheckups();
  } catch (e) {
    errEl.textContent = e.message || "Save failed";
    toast("Failed to add payment.", "err");
  }
}

async function deleteCheckupPayment(checkupId, paymentId) {
  if (!confirm("Delete this payment?")) return;
  try {
    const res = await fetch("/api/checkups/payments/" + paymentId, { method: "DELETE" });
    if (!res.ok) throw new Error();
    toast("Payment deleted.", "ok");
    loadCheckups();
  } catch (e) {
    toast("Failed to delete payment.", "err");
  }
}
