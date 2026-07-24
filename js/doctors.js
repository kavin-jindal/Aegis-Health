/* ── DOCTORS ── */
let doctorsCache = [];
async function loadDoctors() {
  const el = document.getElementById("doctors-list");
  if (!selectedFamilyId) { el.innerHTML=""; return; }
  el.innerHTML = '<div class="state-box state-loading"><p>Loading…</p></div>';
  try {
    const res = await fetch("/api/doctors?family_member_id=" + selectedFamilyId);
    if (!res.ok) throw new Error();
    doctorsCache = await res.json();
    renderDoctors();
  } catch(err) {
    el.innerHTML='<div class="state-box state-error"><p>Failed to load doctors.</p></div>';
  }
}
function renderDoctors() {
  const el = document.getElementById("doctors-list");
  document.getElementById("doc-count").textContent = doctorsCache.length;
  if (!doctorsCache.length) {
    el.innerHTML='<div class="state-box state-empty"><p>No doctors added yet.</p></div>';
    return;
  }
  el.innerHTML = '<div class="item-card-grid">' + doctorsCache.map(d=>`
    <div class="item-card">
      <div class="item-card-head">
        <div class="item-icon ii-sky">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div>
          <div class="item-card-title">${esc(d.name)}</div>
          <div class="item-card-subtitle">${esc(d.specialty||"General")}</div>
        </div>
      </div>
      <div class="item-card-details">
        ${d.clinic?'<div class="item-card-row"><span class="icr-label">Clinic</span><span class="icr-value">'+esc(d.clinic)+'</span></div>':''}
        ${d.phone?'<div class="item-card-row"><span class="icr-label">Phone</span><span class="icr-value">'+esc(d.phone)+'</span></div>':''}
        ${d.notes?'<div class="item-card-row"><span class="icr-label">Notes</span><span class="icr-value">'+esc(d.notes)+'</span></div>':''}
      </div>
      <div class="item-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="showItemDetail('doctor','${d.id}')">View</button>
        <button class="btn btn-secondary btn-sm" onclick="editDoctor('${d.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteDoctor('${d.id}')">Delete</button>
      </div>
    </div>`).join("") + '</div>';
}
async function saveDoctor() {
  const editId = document.getElementById("doc-edit-id").value;
  const body = {
    family_member_id: selectedFamilyId,
    name:    document.getElementById("doc-name").value.trim(),
    specialty:document.getElementById("doc-specialty").value.trim()||null,
    phone:   document.getElementById("doc-phone").value.trim()||null,
    clinic:  document.getElementById("doc-clinic").value.trim()||null,
    notes:   document.getElementById("doc-notes").value.trim()||null,
  };
  if (!body.name) { document.getElementById("doc-form-err").textContent="Name is required."; return; }
  document.getElementById("doc-form-err").textContent="";
  try {
    const res = await fetch(editId?"/api/doctors/"+editId:"/api/doctors",
      {method:editId?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    if (!res.ok) throw new Error();
    toast(editId?"Doctor updated.":"Doctor added.","ok");
    closeModal("modal-doctor"); clearDoctorForm(); loadDoctors(); loadCheckupDoctors();
  } catch(err) {
    document.getElementById("doc-form-err").textContent="Save failed.";
    toast("Failed to save doctor.","err");
  }
}
function editDoctor(id) { openDoctorModal(id); }
async function deleteDoctor(id) {
  if (!confirm("Delete this doctor?")) return;
  try {
    const res = await fetch("/api/doctors/"+id,{method:"DELETE"});
    if (!res.ok) throw new Error();
    if (document.getElementById("doc-edit-id").value===id) clearDoctorForm();
    toast("Doctor deleted.","ok"); loadDoctors();
  } catch(err) { toast("Failed to delete doctor.","err"); }
}
function clearDoctorForm() {
  ["doc-edit-id","doc-name","doc-specialty","doc-phone","doc-clinic","doc-notes"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("doc-form-err").textContent   = "";
  document.getElementById("doc-save-btn").textContent   = "Add Doctor";
  document.getElementById("doc-form-title").textContent = "Add Doctor";
}
