/* ── MEDICINES ── */
let medicinesCache = [];
async function loadMedicines() {
  const el = document.getElementById("medicines-list");
  if (!selectedFamilyId) { el.innerHTML=""; return; }
  el.innerHTML='<div class="state-box state-loading"><p>Loading…</p></div>';
  try {
    const res = await fetch("/api/medicines?family_member_id="+selectedFamilyId);
    if (!res.ok) throw new Error();
    medicinesCache = await res.json();
    renderMedicines(); loadMedDoctors();
  } catch(err) {
    el.innerHTML='<div class="state-box state-error"><p>Failed to load medicines.</p></div>';
  }
}
async function loadMedDoctors() {
  const sel = document.getElementById("med-doctor");
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
}
function renderMedicines() {
  const el = document.getElementById("medicines-list");
  document.getElementById("med-count").textContent = medicinesCache.length;
  if (!medicinesCache.length) {
    el.innerHTML='<div class="state-box state-empty"><p>No medicines added yet.</p></div>';
    return;
  }
  const today = new Date().toISOString().slice(0,10);
  el.innerHTML = '<div class="item-card-grid">' + medicinesCache.map(m=>{
    const docName  = m.doctors ? m.doctors.name : "";
    const dateRange= [m.start_date, m.end_date].filter(Boolean).join(" \u2013 ");
    const isActive = !m.end_date || m.end_date >= today;
    const badge    = isActive
      ? '<span class="badge badge-sage">Active</span>'
      : '<span class="badge badge-muted">Ended</span>';
    return `
    <div class="item-card">
      <div class="item-card-head">
        <div class="item-icon ii-lavender">
          <svg viewBox="0 0 24 24"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg>
        </div>
        <div>
          <div class="item-card-title">${esc(m.name)} ${badge}</div>
          <div class="item-card-subtitle">${esc(m.dosage||"")}${m.dosage&&m.frequency?" \u00b7 ":""}${esc(m.frequency||"")}</div>
        </div>
      </div>
      <div class="item-card-details">
        ${docName?'<div class="item-card-row"><span class="icr-label">Doctor</span><span class="icr-value">Dr. '+esc(docName)+'</span></div>':''}
        ${dateRange?'<div class="item-card-row"><span class="icr-label">Duration</span><span class="icr-value">'+esc(dateRange)+'</span></div>':''}
      </div>
      <div class="item-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="showItemDetail('medicine','${m.id}')">View</button>
        <button class="btn btn-secondary btn-sm" onclick="editMedicine('${m.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteMedicine('${m.id}')">Delete</button>
      </div>
    </div>`;
  }).join("") + '</div>';
}
async function saveMedicine() {
  const editId = document.getElementById("med-edit-id").value;
  const body = {
    family_member_id: selectedFamilyId,
    name:      document.getElementById("med-name").value.trim(),
    dosage:    document.getElementById("med-dosage").value.trim()||null,
    frequency: document.getElementById("med-frequency").value.trim()||null,
    doctor_id: document.getElementById("med-doctor").value||null,
    start_date:document.getElementById("med-start").value||null,
    end_date:  document.getElementById("med-end").value||null,
  };
  if (!body.name) { document.getElementById("med-form-err").textContent="Name required."; return; }
  document.getElementById("med-form-err").textContent="";
  try {
    const res = await fetch(editId?"/api/medicines/"+editId:"/api/medicines",
      {method:editId?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    if (!res.ok) throw new Error();
    toast(editId?"Medicine updated.":"Medicine added.","ok");
    clearMedicineForm(); loadMedicines();
  } catch(err) {
    document.getElementById("med-form-err").textContent="Save failed.";
    toast("Failed to save medicine.","err");
  }
}
function editMedicine(id) { openMedicineModal(id); }
async function deleteMedicine(id) {
  if (!confirm("Delete this medicine?")) return;
  try {
    const res = await fetch("/api/medicines/"+id,{method:"DELETE"});
    if (!res.ok) throw new Error();
    if (document.getElementById("med-edit-id").value===id) clearMedicineForm();
    toast("Medicine deleted.","ok"); loadMedicines();
  } catch(err) { toast("Failed to delete medicine.","err"); }
}
function clearMedicineForm() {
  ["med-edit-id","med-name","med-dosage","med-frequency","med-doctor","med-start","med-end"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("med-form-err").textContent="";
  document.getElementById("med-save-btn").textContent   = "Add Medicine";
  document.getElementById("med-form-title").textContent = "Add Medicine";
}
