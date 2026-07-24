/* ── EMERGENCY ── */
async function loadEmergencyInfo() {
  const el = document.getElementById("qr-image-container");
  el.innerHTML='<p>Loading…</p>';
  if (!selectedFamilyId) { el.innerHTML=""; return; }
  ["qr-blood","qr-allergies","qr-conditions","qr-contact-name","qr-contact-phone"]
    .forEach(id=>document.getElementById(id).value="");
  document.getElementById("qr-form-err").textContent="";
  try {
    const res = await fetch("/api/emergency?family_member_id="+selectedFamilyId);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data) {
      if (data.blood_group)             document.getElementById("qr-blood").value          = data.blood_group;
      if (data.allergies)               document.getElementById("qr-allergies").value       = data.allergies;
      if (data.conditions)              document.getElementById("qr-conditions").value      = data.conditions;
      if (data.emergency_contact_name)  document.getElementById("qr-contact-name").value   = data.emergency_contact_name;
      if (data.emergency_contact_phone) document.getElementById("qr-contact-phone").value  = data.emergency_contact_phone;
    }
    if (data && data.blood_group) showQR();
    else el.innerHTML='<p>Save your emergency info to generate a QR code.</p>';
  } catch(err) {
    el.innerHTML='<p style="color:var(--coral)">Failed to load emergency info.</p>';
  }
}
async function saveEmergencyInfo() {
  const body = {
    family_member_id:        selectedFamilyId,
    blood_group:             document.getElementById("qr-blood").value.trim()||null,
    allergies:               document.getElementById("qr-allergies").value.trim()||null,
    conditions:              document.getElementById("qr-conditions").value.trim()||null,
    emergency_contact_name:  document.getElementById("qr-contact-name").value.trim()||null,
    emergency_contact_phone: document.getElementById("qr-contact-phone").value.trim()||null,
  };
  document.getElementById("qr-form-err").textContent="";
  try {
    const res = await fetch("/api/emergency",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    if (!res.ok) throw new Error();
    toast("Emergency info saved.","ok"); showQR();
  } catch(err) {
    document.getElementById("qr-form-err").textContent="Save failed.";
    toast("Failed to save emergency info.","err");
  }
}
function showQR() {
  const el = document.getElementById("qr-image-container");
  if (!selectedFamilyId) return;
  el.innerHTML='<p style="color:var(--text-dim)">Generating QR…</p>';
  const img = new Image();
  img.src = "/api/emergency/qr/" + selectedFamilyId;
  img.alt = "Emergency QR Code";
  img.onload  = () => { el.innerHTML=""; el.appendChild(img); };
  img.onerror = () => { el.innerHTML='<p style="color:var(--coral)">QR could not be generated. Save info first.</p>'; };
}
