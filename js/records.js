/* ── RECORDS ── */
let recordsCache = [];
async function loadRecords() {
  const el = document.getElementById("records-list");
  if (!selectedFamilyId) { el.innerHTML=""; return; }
  el.innerHTML='<div class="state-box state-loading"><p>Loading…</p></div>';
  try {
    const res = await fetch("/api/records?family_member_id="+selectedFamilyId);
    if (!res.ok) throw new Error();
    recordsCache = await res.json();
    renderRecords();
  } catch(err) {
    el.innerHTML='<div class="state-box state-error"><p>Failed to load records.</p></div>';
  }
}
function renderRecords() {
  const el = document.getElementById("records-list");
  document.getElementById("rec-count").textContent = recordsCache.length;
  if (!recordsCache.length) {
    el.innerHTML='<div class="state-box state-empty"><p>No records uploaded yet.</p></div>';
    return;
  }
  el.innerHTML = '<div class="item-card-grid">' + recordsCache.map(r=>`
    <div class="item-card">
      <div class="item-card-head">
        <div class="item-icon ii-amber">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div>
          <div class="item-card-title">${esc(r.title)}</div>
          <div class="item-card-subtitle">${esc(r.record_type||"Record")}${r.record_date?" \u00b7 "+esc(r.record_date):""}</div>
        </div>
      </div>
      <div class="item-card-details">
        ${r.hospital?'<div class="item-card-row"><span class="icr-label">Hospital</span><span class="icr-value">'+esc(r.hospital)+'</span></div>':''}
        ${r.cost?'<div class="item-card-row"><span class="icr-label">Cost</span><span class="icr-value">\u20b9'+Number(r.cost).toLocaleString()+'</span></div>':''}
      </div>
      <div class="item-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="showItemDetail('record','${r.id}')">View</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRecord('${r.id}')">Delete</button>
      </div>
    </div>`).join("") + '</div>';
}
async function uploadRecord() {
  const title = document.getElementById("rec-title").value.trim();
  const file  = document.getElementById("rec-file").files[0];
  document.getElementById("rec-form-err").textContent = "";
  if (!title) { document.getElementById("rec-form-err").textContent="Title required."; return; }
  if (!file)  { document.getElementById("rec-form-err").textContent="Please select a file."; return; }
  const fd = new FormData();
  fd.append("family_member_id",selectedFamilyId);
  fd.append("title",title);
  fd.append("record_type",document.getElementById("rec-type").value.trim()||"");
  fd.append("record_date",document.getElementById("rec-date").value||"");
  fd.append("hospital",document.getElementById("rec-hospital").value.trim()||"");
  fd.append("cost",document.getElementById("rec-cost").value||"");
  fd.append("file",file);
  const btn = document.getElementById("rec-upload-btn");
  btn.disabled=true; btn.textContent="Uploading…";
  try {
    const res = await fetch("/api/records",{method:"POST",body:fd});
    if (!res.ok) {
      const e = await res.json();
      document.getElementById("rec-form-err").textContent = e.error||"Upload failed.";
      toast("Upload failed.","err"); return;
    }
    ["rec-title","rec-type","rec-date","rec-hospital","rec-cost","rec-file"].forEach(id=>document.getElementById(id).value="");
    toast("Record uploaded.","ok"); loadRecords();
  } catch(err) {
    document.getElementById("rec-form-err").textContent="Upload failed.";
    toast("Upload failed.","err");
  } finally { btn.disabled=false; btn.textContent="Upload Record"; }
}
async function deleteRecord(id) {
  if (!confirm("Delete this record? Cannot be undone.")) return;
  try {
    const res = await fetch("/api/records/"+id,{method:"DELETE"});
    if (!res.ok) throw new Error();
    toast("Record deleted.","ok"); loadRecords();
  } catch(err) { toast("Failed to delete record.","err"); }
}
