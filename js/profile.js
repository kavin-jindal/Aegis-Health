/* ── PROFILE PAGE ── */
function calcPageProfAge() {
  var dob = document.getElementById("prof-page-dob").value;
  var row = document.getElementById("prof-page-age-row");
  var display = document.getElementById("prof-page-age-display");
  if (!dob) { row.style.display = "none"; return; }
  var birth = new Date(dob);
  var today = new Date();
  var age = today.getFullYear() - birth.getFullYear();
  var mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
  row.style.display = "";
  display.textContent = age + " years";
}

async function loadProfilePage() {
  if (!selectedFamilyId) return;
  document.getElementById("prof-page-err").textContent = "";
  document.getElementById("prof-page-age-row").style.display = "none";
  var photoImg = document.getElementById("profile-photo-img");
  var photoPlaceholder = document.getElementById("profile-photo-placeholder");
  photoImg.style.display = "none";
  photoPlaceholder.style.display = "";
  try {
    var res = await fetch("/api/profiles/" + selectedFamilyId);
    if (res.ok) {
      var p = await res.json();
      if (p) {
        document.getElementById("prof-page-fullname").value = p.full_name || "";
        document.getElementById("prof-page-relation").value = p.relation || "";
        document.getElementById("prof-page-dob").value = p.date_of_birth || "";
        document.getElementById("prof-page-gender").value = p.gender || "";
        document.getElementById("prof-page-location").value = p.location || "";
        document.getElementById("prof-page-blood").value = p.blood_group || "";
        document.getElementById("profile-display-name").textContent = p.full_name || selectedMemberName;
        document.getElementById("profile-display-relation").textContent = p.relation || "";
        if (p.profile_photo_url) {
          photoImg.src = p.profile_photo_url;
          photoImg.style.display = "";
          photoPlaceholder.style.display = "none";
        }
        calcPageProfAge();
      } else {
        document.getElementById("prof-page-fullname").value = selectedMemberName || "";
        document.getElementById("profile-display-name").textContent = selectedMemberName || "\u2014";
        var member = familyMembersCache.find(m => String(m.id) === selectedFamilyId);
        document.getElementById("profile-display-relation").textContent = member ? member.relation : "";
        document.getElementById("prof-page-relation").value = member ? member.relation : "";
      }
    }
  } catch(e) {}
}

async function saveProfilePage() {
  var err = document.getElementById("prof-page-err");
  err.textContent = "";
  var fullName = document.getElementById("prof-page-fullname").value.trim();
  if (!fullName) { err.textContent = "Full name is required"; return; }
  var payload = {
    family_member_id: selectedFamilyId,
    full_name: fullName,
    relation: document.getElementById("prof-page-relation").value || null,
    date_of_birth: document.getElementById("prof-page-dob").value || null,
    gender: document.getElementById("prof-page-gender").value || null,
    location: document.getElementById("prof-page-location").value.trim() || null,
    blood_group: document.getElementById("prof-page-blood").value || null
  };
  try {
    var res = await fetch("/api/profiles", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    if (!res.ok) { var d = await res.json(); err.textContent = d.error || "Save failed"; return; }
    document.getElementById("profile-display-name").textContent = fullName;
    document.getElementById("profile-display-relation").textContent = payload.relation || "";
    toast("Profile saved.");
  } catch(e) { err.textContent = "Network error"; }
}

function triggerPhotoUpload() {
  document.getElementById("profile-photo-input").click();
}

async function handlePhotoUpload(e) {
  if (!selectedFamilyId || !e.target.files.length) return;
  var file = e.target.files[0];
  var fd = new FormData();
  fd.append("photo", file);
  try {
    var res = await fetch("/api/profiles/" + selectedFamilyId + "/photo", {
      method: "POST", body: fd
    });
    if (!res.ok) { var d = await res.json(); toast(d.error || "Upload failed", "err"); return; }
    var data = await res.json();
    var img = document.getElementById("profile-photo-img");
    img.src = data.profile_photo_url + "?t=" + Date.now();
    img.style.display = "";
    document.getElementById("profile-photo-placeholder").style.display = "none";
    toast("Photo uploaded.");
    loadFamilyMembers();
  } catch(e) { toast("Upload failed.", "err"); }
  e.target.value = "";
}

async function deleteProfilePhoto() {
  if (!selectedFamilyId) return;
  try {
    var res = await fetch("/api/profiles/" + selectedFamilyId + "/photo", { method: "DELETE" });
    if (res.ok) {
      document.getElementById("profile-photo-img").style.display = "none";
      document.getElementById("profile-photo-placeholder").style.display = "";
      toast("Photo removed.");
      loadFamilyMembers();
    }
  } catch(e) {}
}
