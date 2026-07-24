/* ── SETTINGS PAGE ── */
async function loadSettingsPage() {
  try {
    var res = await fetch("/api/settings");
    if (res.ok) {
      var s = await res.json();
      if (s) {
        document.getElementById("set-admin-name").value = s.admin_name || "";
        document.getElementById("set-admin-email").value = s.admin_email || "";
        document.getElementById("set-family-name").value = s.family_name || "";
      }
    }
  } catch(e) {}
  loadSettingsFamilyList();
}

async function saveAdminSettings() {
  var err = document.getElementById("set-admin-err");
  err.textContent = "";
  var payload = {
    admin_name: document.getElementById("set-admin-name").value.trim() || null,
    admin_email: document.getElementById("set-admin-email").value.trim() || null,
    family_name: document.getElementById("set-family-name").value.trim() || null,
  };
  try {
    var res = await fetch("/api/settings", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    if (!res.ok) { var d = await res.json(); err.textContent = d.error || "Save failed"; return; }
    if (payload.admin_name) {
      document.getElementById("admin-name").textContent = payload.admin_name;
      document.getElementById("admin-av").textContent = getInitials(payload.admin_name);
    }
    toast("Settings saved.");
  } catch(e) { err.textContent = "Network error"; }
}

async function loadSettingsFamilyList() {
  var el = document.getElementById("settings-family-list");
  try {
    var res = await fetch("/api/family_members");
    if (!res.ok) throw new Error();
    var members = await res.json();
    if (!members.length) {
      el.innerHTML = '<div class="state-box state-empty"><p>No members yet.</p></div>';
      return;
    }
    var html = "";
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      var color = AVATAR_COLORS[i % AVATAR_COLORS.length];
      html += '<div class="settings-member-row">' +
        '<div class="settings-member-av" style="background:' + color + ';">' + esc(getInitials(m.name)) + '</div>' +
        '<div class="settings-member-info">' +
          '<div class="settings-member-name">' + esc(m.name) + '</div>' +
          '<div class="settings-member-rel">' + esc(m.relation) + '</div>' +
        '</div>' +
        '<button class="settings-member-del" title="Remove" onclick="removeSettingsMember(\'' + m.id + '\',\'' + esc(m.name).replace(/'/g, "\\'") + '\')">&times;</button>' +
      '</div>';
    }
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div class="state-box state-empty"><p>Failed to load.</p></div>';
  }
}

async function removeSettingsMember(id, name) {
  if (!confirm("Remove " + name + " and all their data?")) return;
  try {
    var res = await fetch("/api/settings/family/" + id, { method: "DELETE" });
    if (!res.ok) throw new Error();
    loadSettingsFamilyList();
    loadFamilyMembers();
    toast("Member removed.");
  } catch(e) { toast("Failed to remove.", "err"); }
}

function openSettingsAddMember() {
  openMemberModal();
}
