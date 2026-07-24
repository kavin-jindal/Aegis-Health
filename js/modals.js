/* ── MODAL HELPERS ── */
function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add("open"); }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove("open"); }

function openDetailModal(html) {
  let modal = document.getElementById("modal-detail");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-detail";
    modal.className = "modal-overlay";
    modal.innerHTML = '<div class="modal-box" style="width:560px;max-width:90vw"><div class="modal-head"><h3>Details</h3><button class="modal-close" onclick="closeModal(\'modal-detail\')">&times;</button></div><div id="modal-detail-content"></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal("modal-detail"); });
  }
  document.getElementById("modal-detail-content").innerHTML = html;
  openModal("modal-detail");
}

function showItemDetail(type, id) {
  let html = "";
  if (type === "doctor") {
    const d = doctorsCache.find(x => x.id === id); if (!d) return;
    html = '<div class="detail-modal-content"><div class="detail-title">' + esc(d.name) + '</div>' +
      '<div class="detail-row"><div class="detail-label">Specialty</div><div class="detail-value">' + esc(d.specialty || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Clinic</div><div class="detail-value">' + esc(d.clinic || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Phone</div><div class="detail-value">' + esc(d.phone || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Notes</div><div class="detail-value">' + esc(d.notes || "\u2014") + '</div></div></div>';
  } else if (type === "checkup") {
    const c = checkupsCache.find(x => x.id === id); if (!c) return;
    const docName = c.doctors ? c.doctors.name : "\u2014";
    const docs = c.checkup_documents || [];
    const pays = c.checkup_payments || [];
    const totalPaid = pays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const docHtml = docs.length ? '<div class="detail-row"><div class="detail-label">Documents</div><div class="detail-value">' +
      docs.map(d => '<div style="display:flex;align-items:center;gap:8px;margin-top:4px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border)"><a href="' + esc(d.file_url) + '" target="_blank" rel="noopener" style="flex:1;font-size:.85rem;color:var(--sage);text-decoration:none">' + esc(d.title || d.file_type) + '</a><span style="font-size:.7rem;color:var(--text-dim)">' + (d.file_size ? (d.file_size/1024).toFixed(1)+' KB' : '') + '</span><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();deleteCheckupDocument(\'' + esc(c.id) + '\',\'' + esc(d.id) + '\')" style="padding:2px 6px">Delete</button></div>').join('') +
      '</div></div>' : '';
    const payHtml = pays.length ? '<div class="detail-row"><div class="detail-label">Payments</div><div class="detail-value">' +
      pays.map(p => '<div style="display:flex;align-items:center;gap:8px;margin-top:4px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border)"><span style="flex:1;font-size:.85rem">\u20b9' + Number(p.amount).toLocaleString() + ' &middot; ' + esc(p.payment_method || '') + ' &middot; ' + esc(p.payment_date) + '</span><span style="font-size:.7rem;color:var(--text-dim)">' + esc(p.notes || '') + '</span><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();deleteCheckupPayment(\'' + esc(c.id) + '\',\'' + esc(p.id) + '\')" style="padding:2px 6px">Delete</button></div>').join('') +
      '<div style="margin-top:8px;padding:8px;background:rgba(143,174,139,0.1);border-radius:8px;border:1px solid rgba(143,174,139,0.2);font-weight:600;color:var(--sage)">Total Paid: \u20b9' + totalPaid.toLocaleString() + '</div></div></div>' : '';
    html = '<div class="detail-modal-content"><div class="detail-title">' + esc(c.diagnosis || "Checkup") + '</div>' +
      '<div class="detail-row"><div class="detail-label">Date</div><div class="detail-value">' + esc(c.checkup_date || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Doctor</div><div class="detail-value">' + esc(docName) + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Diagnosis</div><div class="detail-value">' + esc(c.diagnosis || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Follow-up</div><div class="detail-value">' + esc(c.follow_up_date || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Notes</div><div class="detail-value">' + esc(c.notes || "\u2014") + '</div></div>' +
      docHtml + payHtml +
      '<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);display:flex;gap:8px">' +
      '<button class="btn btn-primary btn-sm" onclick="openCheckupDocumentModal(\'' + esc(c.id) + '\')"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> Upload Document</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="openCheckupPaymentModal(\'' + esc(c.id) + '\')"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Add Payment</button>' +
      '</div></div>';
  } else if (type === "medicine") {
    const m = medicinesCache.find(x => x.id === id); if (!m) return;
    const docName = m.doctors ? m.doctors.name : "\u2014";
    const today = new Date().toISOString().slice(0, 10);
    const active = !m.end_date || m.end_date >= today;
    const range = [m.start_date, m.end_date].filter(Boolean).join(" \u2013 ") || "\u2014";
    html = '<div class="detail-modal-content"><div class="detail-title">' + esc(m.name) + (active ? ' <span class="badge badge-sage">Active</span>' : ' <span class="badge badge-muted">Ended</span>') + '</div>' +
      '<div class="detail-row"><div class="detail-label">Dosage</div><div class="detail-value">' + esc(m.dosage || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Frequency</div><div class="detail-value">' + esc(m.frequency || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Prescribed by</div><div class="detail-value">' + esc(docName) + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Date Range</div><div class="detail-value">' + esc(range) + '</div></div></div>';
  } else if (type === "record") {
    const r = recordsCache.find(x => x.id === id); if (!r) return;
    let filePreview = "";
    if (r.file_url) {
      const url = r.file_url.toLowerCase();
      if (url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".png")) {
        filePreview = '<div style="margin-top:12px"><img src="' + esc(r.file_url) + '" style="max-width:100%;border-radius:8px;border:1px solid var(--border);" alt="Record document"></div>';
      } else if (url.endsWith(".pdf")) {
        filePreview = '<div style="margin-top:12px"><iframe src="' + esc(r.file_url) + '" style="width:100%;height:400px;border:1px solid var(--border);border-radius:8px;" title="PDF Preview"></iframe></div>';
      } else {
        filePreview = '<div style="margin-top:12px"><a href="' + esc(r.file_url) + '" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Download File</a></div>';
      }
    }
    html = '<div class="detail-modal-content"><div class="detail-title">' + esc(r.title) + '</div>' +
      '<div class="detail-row"><div class="detail-label">Type</div><div class="detail-value">' + esc(r.record_type || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Date</div><div class="detail-value">' + esc(r.record_date || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Hospital</div><div class="detail-value">' + esc(r.hospital || "\u2014") + '</div></div>' +
      '<div class="detail-row"><div class="detail-label">Cost</div><div class="detail-value">' + (r.cost ? "\u20b9" + Number(r.cost).toLocaleString() : "\u2014") + '</div></div>' +
      filePreview + '</div>';
  } else if (type === "fitness") {
    const f = fitnessCache.find(x => x.id === id); if (!f) return;
    const FT = { steps: 10000, calories: 2000, water_ml: 2000, sleep_hours: 8 };
    const metrics = [
      { label: "Steps", val: f.steps || 0, target: FT.steps, unit: "", fill: "fill-sage" },
      { label: "Calories", val: f.calories || 0, target: FT.calories, unit: " kcal", fill: "fill-amber" },
      { label: "Water", val: f.water_ml || 0, target: FT.water_ml, unit: " ml", fill: "fill-sky" },
      { label: "Sleep", val: f.sleep_hours || 0, target: FT.sleep_hours, unit: " hrs", fill: "fill-lavender" }
    ];
    html = '<div class="detail-modal-content"><div class="detail-title">' + esc(f.log_date) + '</div>' +
      metrics.map(function(m) {
        var pct = Math.min(100, Math.round((m.val / m.target) * 100));
        return '<div class="detail-row"><div class="detail-label">' + m.label + '</div><div class="detail-value">' + m.val.toLocaleString() + ' / ' + m.target.toLocaleString() + m.unit +
          '<div class="prog-track" style="margin-top:6px"><div class="prog-fill ' + m.fill + '" style="width:' + pct + '%"></div></div></div></div>';
      }).join("") + '</div>';
  }
  openDetailModal(html);
}

/* ── SECTION MODALS ── */
function createModals() {
  var m;
  m = document.createElement("div"); m.id = "modal-doctor"; m.className = "modal-overlay";
  m.innerHTML = '<div class="modal-box"><div class="modal-head"><h3 id="doc-form-title">Add Doctor</h3><button class="modal-close" onclick="closeModal(\'modal-doctor\')">&times;</button></div>' +
    '<input type="hidden" id="doc-edit-id" value="">' +
    '<div class="fg"><label for="doc-name">Name *</label><input type="text" id="doc-name" placeholder="Dr. Full Name"></div>' +
    '<div class="fg"><label for="doc-specialty">Specialty</label><input type="text" id="doc-specialty" placeholder="Cardiologist, GP..."></div>' +
    '<div class="fg"><label for="doc-phone">Phone</label><input type="text" id="doc-phone" placeholder="+91 xxxxxxxxxx"></div>' +
    '<div class="fg"><label for="doc-clinic">Clinic / Hospital</label><input type="text" id="doc-clinic" placeholder="Clinic name"></div>' +
    '<div class="fg"><label for="doc-notes">Notes</label><input type="text" id="doc-notes" placeholder="Any notes"></div>' +
    '<div class="form-err" id="doc-form-err"></div>' +
    '<div class="form-actions"><button class="btn btn-primary" id="doc-save-btn" onclick="saveDoctor()">Add Doctor</button>' +
    '<button class="btn btn-secondary" onclick="closeModal(\'modal-doctor\')">Cancel</button></div></div>';
  document.body.appendChild(m);
  m.addEventListener("click", function(e) { if (e.target === m) closeModal("modal-doctor"); });

  m = document.createElement("div"); m.id = "modal-checkup"; m.className = "modal-overlay";
  m.innerHTML = '<div class="modal-box"><div class="modal-head"><h3 id="cup-form-title">Add Checkup</h3><button class="modal-close" onclick="closeModal(\'modal-checkup\')">&times;</button></div>' +
    '<input type="hidden" id="cup-edit-id" value="">' +
    '<div class="fg"><label for="cup-date">Date *</label><input type="date" id="cup-date"></div>' +
    '<div class="fg"><label for="cup-doctor">Doctor</label><select id="cup-doctor"><option value="">None</option></select></div>' +
    '<div class="fg"><label for="cup-diagnosis">Diagnosis</label><input type="text" id="cup-diagnosis" placeholder="Diagnosis / reason for visit"></div>' +
    '<div class="fg"><label for="cup-followup">Follow-up Date</label><input type="date" id="cup-followup"></div>' +
    '<div class="fg"><label for="cup-notes">Notes</label><input type="text" id="cup-notes" placeholder="Notes"></div>' +
    '<div class="form-err" id="cup-form-err"></div>' +
    '<div class="form-actions"><button class="btn btn-primary" id="cup-save-btn" onclick="saveCheckup()">Add Checkup</button>' +
    '<button class="btn btn-secondary" onclick="closeModal(\'modal-checkup\')">Cancel</button></div></div>';
  document.body.appendChild(m);
  m.addEventListener("click", function(e) { if (e.target === m) closeModal("modal-checkup"); });

  m = document.createElement("div"); m.id = "modal-medicine"; m.className = "modal-overlay";
  m.innerHTML = '<div class="modal-box"><div class="modal-head"><h3 id="med-form-title">Add Medicine</h3><button class="modal-close" onclick="closeModal(\'modal-medicine\')">&times;</button></div>' +
    '<input type="hidden" id="med-edit-id" value="">' +
    '<div class="fg"><label for="med-name">Name *</label><input type="text" id="med-name" placeholder="Medicine name"></div>' +
    '<div class="fg"><label for="med-dosage">Dosage</label><input type="text" id="med-dosage" placeholder="500 mg"></div>' +
    '<div class="fg"><label for="med-frequency">Frequency</label><input type="text" id="med-frequency" placeholder="Twice daily, after meals..."></div>' +
    '<div class="fg"><label for="med-doctor">Prescribed by</label><select id="med-doctor"><option value="">None</option></select></div>' +
    '<div class="fg"><label for="med-start">Start Date</label><input type="date" id="med-start"></div>' +
    '<div class="fg"><label for="med-end">End Date</label><input type="date" id="med-end"></div>' +
    '<div class="form-err" id="med-form-err"></div>' +
    '<div class="form-actions"><button class="btn btn-primary" id="med-save-btn" onclick="saveMedicine()">Add Medicine</button>' +
    '<button class="btn btn-secondary" onclick="closeModal(\'modal-medicine\')">Cancel</button></div></div>';
  document.body.appendChild(m);
  m.addEventListener("click", function(e) { if (e.target === m) closeModal("modal-medicine"); });

  m = document.createElement("div"); m.id = "modal-record"; m.className = "modal-overlay";
  m.innerHTML = '<div class="modal-box"><div class="modal-head"><h3>Upload Record</h3><button class="modal-close" onclick="closeModal(\'modal-record\')">&times;</button></div>' +
    '<div class="fg"><label for="rec-title">Title *</label><input type="text" id="rec-title" placeholder="e.g. Blood Test Report"></div>' +
    '<div class="fg"><label for="rec-type">Type</label><input type="text" id="rec-type" placeholder="Lab report, X-ray, Prescription..."></div>' +
    '<div class="fg"><label for="rec-hospital">Hospital / Clinic</label><input type="text" id="rec-hospital" placeholder="Hospital or clinic name"></div>' +
    '<div class="fg"><label for="rec-cost">Cost (\u20b9)</label><input type="number" id="rec-cost" placeholder="0.00" step="0.01" min="0"></div>' +
    '<div class="fg"><label for="rec-date">Date</label><input type="date" id="rec-date"></div>' +
    '<div class="fg"><label for="rec-file">File <span style="text-transform:none;font-weight:400;color:var(--text-dim)">(PDF, JPG, PNG, DICOM - max 10 MB)</span></label>' +
    '<input type="file" id="rec-file" accept=".pdf,.jpg,.jpeg,.png,.dcm,.dicom"></div>' +
    '<div class="form-err" id="rec-form-err"></div>' +
    '<div class="form-actions"><button class="btn btn-primary btn-full" id="rec-upload-btn" onclick="uploadRecord()">Upload Record</button></div></div>';
  document.body.appendChild(m);
  m.addEventListener("click", function(e) { if (e.target === m) closeModal("modal-record"); });

  m = document.createElement("div"); m.id = "modal-fitness"; m.className = "modal-overlay";
  m.innerHTML = '<div class="modal-box"><div class="modal-head"><h3>Log Fitness</h3><button class="modal-close" onclick="closeModal(\'modal-fitness\')">&times;</button></div>' +
    '<div class="fg"><label for="fit-date">Date</label><input type="date" id="fit-date"></div>' +
    '<div class="fg"><label for="fit-steps">Steps</label><input type="number" id="fit-steps" placeholder="0" min="0"></div>' +
    '<div class="fg"><label for="fit-calories">Calories (kcal)</label><input type="number" id="fit-calories" placeholder="0" min="0"></div>' +
    '<div class="fg"><label for="fit-water">Water (ml)</label><input type="number" id="fit-water" placeholder="0" min="0"></div>' +
    '<div class="fg"><label for="fit-sleep">Sleep (hours)</label><input type="number" id="fit-sleep" step="0.5" placeholder="0" min="0" max="24"></div>' +
    '<div class="form-err" id="fit-form-err"></div>' +
    '<div class="form-actions"><button class="btn btn-primary btn-full" onclick="saveFitnessLog()">Save Log</button></div></div>';
  document.body.appendChild(m);
  m.addEventListener("click", function(e) { if (e.target === m) closeModal("modal-fitness"); });

  m = document.createElement("div"); m.id = "modal-emergency"; m.className = "modal-overlay";
  m.innerHTML = '<div class="modal-box"><div class="modal-head"><h3>Emergency Info</h3><button class="modal-close" onclick="closeModal(\'modal-emergency\')">&times;</button></div>' +
    '<div class="fg"><label for="qr-blood">Blood Group</label><input type="text" id="qr-blood" placeholder="O+, A-, AB+..."></div>' +
    '<div class="fg"><label for="qr-allergies">Allergies</label><input type="text" id="qr-allergies" placeholder="Penicillin, peanuts..."></div>' +
    '<div class="fg"><label for="qr-conditions">Conditions</label><input type="text" id="qr-conditions" placeholder="Diabetes, asthma..."></div>' +
    '<div class="fg"><label for="qr-contact-name">Emergency Contact Name</label><input type="text" id="qr-contact-name" placeholder="Full name"></div>' +
    '<div class="fg"><label for="qr-contact-phone">Emergency Contact Phone</label><input type="text" id="qr-contact-phone" placeholder="+91 xxxxxxxxxx"></div>' +
    '<div class="form-err" id="qr-form-err"></div>' +
    '<div class="form-actions"><button class="btn btn-primary btn-full" onclick="saveEmergencyInfo()">Save &amp; Generate QR</button></div></div>';
  document.body.appendChild(m);
  m.addEventListener("click", function(e) { if (e.target === m) closeModal("modal-emergency"); });
}

function openDoctorModal(editId) {
  document.getElementById("doc-form-err").textContent = "";
  if (editId) {
    var d = doctorsCache.find(x => x.id === editId); if (!d) return;
    document.getElementById("doc-edit-id").value = d.id;
    document.getElementById("doc-name").value = d.name || "";
    document.getElementById("doc-specialty").value = d.specialty || "";
    document.getElementById("doc-phone").value = d.phone || "";
    document.getElementById("doc-clinic").value = d.clinic || "";
    document.getElementById("doc-notes").value = d.notes || "";
    document.getElementById("doc-form-title").textContent = "Edit Doctor";
    document.getElementById("doc-save-btn").textContent = "Update Doctor";
  } else {
    document.getElementById("doc-edit-id").value = "";
    ["doc-name","doc-specialty","doc-phone","doc-clinic","doc-notes"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("doc-form-title").textContent = "Add Doctor";
    document.getElementById("doc-save-btn").textContent = "Add Doctor";
  }
  openModal("modal-doctor");
}

function openCheckupModal(editId) {
  document.getElementById("cup-form-err").textContent = "";
  loadCheckupDoctors();
  if (editId) {
    var c = checkupsCache.find(x => x.id === editId); if (!c) return;
    document.getElementById("cup-edit-id").value = c.id;
    document.getElementById("cup-date").value = c.checkup_date || "";
    document.getElementById("cup-doctor").value = c.doctor_id || "";
    document.getElementById("cup-diagnosis").value = c.diagnosis || "";
    document.getElementById("cup-notes").value = c.notes || "";
    document.getElementById("cup-followup").value = c.follow_up_date || "";
    document.getElementById("cup-form-title").textContent = "Edit Checkup";
    document.getElementById("cup-save-btn").textContent = "Update Checkup";
  } else {
    document.getElementById("cup-edit-id").value = "";
    ["cup-date","cup-doctor","cup-diagnosis","cup-notes","cup-followup"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("cup-form-title").textContent = "Add Checkup";
    document.getElementById("cup-save-btn").textContent = "Add Checkup";
  }
  openModal("modal-checkup");
}

function openMedicineModal(editId) {
  document.getElementById("med-form-err").textContent = "";
  loadMedDoctors();
  if (editId) {
    var m = medicinesCache.find(x => x.id === editId); if (!m) return;
    document.getElementById("med-edit-id").value = m.id;
    document.getElementById("med-name").value = m.name || "";
    document.getElementById("med-dosage").value = m.dosage || "";
    document.getElementById("med-frequency").value = m.frequency || "";
    document.getElementById("med-doctor").value = m.doctor_id || "";
    document.getElementById("med-start").value = m.start_date || "";
    document.getElementById("med-end").value = m.end_date || "";
    document.getElementById("med-form-title").textContent = "Edit Medicine";
    document.getElementById("med-save-btn").textContent = "Update Medicine";
  } else {
    document.getElementById("med-edit-id").value = "";
    ["med-name","med-dosage","med-frequency","med-doctor","med-start","med-end"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("med-form-title").textContent = "Add Medicine";
    document.getElementById("med-save-btn").textContent = "Add Medicine";
  }
  openModal("modal-medicine");
}

function openRecordModal() {
  document.getElementById("rec-form-err").textContent = "";
  ["rec-title","rec-type","rec-date","rec-hospital","rec-cost","rec-file"].forEach(id => document.getElementById(id).value = "");
  openModal("modal-record");
}

function openFitnessModal(editId) {
  document.getElementById("fit-form-err").textContent = "";
  if (editId) {
    var l = fitnessCache.find(x => x.id === editId); if (!l) return;
    document.getElementById("fit-date").value = l.log_date || "";
    document.getElementById("fit-steps").value = l.steps || "";
    document.getElementById("fit-calories").value = l.calories || "";
    document.getElementById("fit-water").value = l.water_ml || "";
    document.getElementById("fit-sleep").value = l.sleep_hours || "";
  } else {
    var today = new Date().toISOString().slice(0, 10);
    document.getElementById("fit-date").value = today;
    ["fit-steps","fit-calories","fit-water","fit-sleep"].forEach(id => document.getElementById(id).value = "");
  }
  openModal("modal-fitness");
}

async function openEmergencyModal() {
  document.getElementById("qr-form-err").textContent = "";
  if (selectedFamilyId) {
    try {
      var res = await fetch("/api/emergency?family_member_id=" + selectedFamilyId);
      if (res.ok) {
        var data = await res.json();
        if (data) {
          document.getElementById("qr-blood").value = data.blood_group || "";
          document.getElementById("qr-allergies").value = data.allergies || "";
          document.getElementById("qr-conditions").value = data.conditions || "";
          document.getElementById("qr-contact-name").value = data.emergency_contact_name || "";
          document.getElementById("qr-contact-phone").value = data.emergency_contact_phone || "";
        } else {
          ["qr-blood","qr-allergies","qr-conditions","qr-contact-name","qr-contact-phone"].forEach(id => document.getElementById(id).value = "");
        }
      }
    } catch(e) {}
  }
  openModal("modal-emergency");
}
