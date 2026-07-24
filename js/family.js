/* ── FAMILY ── */
let familyMembersCache = [];

async function loadFamilyMembers() {
  document.getElementById("dash-greeting").textContent = greetingWord();
  const grid = document.getElementById("member-grid");
  grid.innerHTML = '<div class="fam-state">Loading…</div>';
  try {
    const res = await fetch("/api/family_members");
    if (!res.ok) throw new Error();
    const members = await res.json();
    familyMembersCache = members;

    // Populate admin sidebar block from first family member
    var adminAv = document.getElementById("admin-av");
    var adminName = document.getElementById("admin-name");
    var adminRole = document.getElementById("admin-role");
    if (members.length) {
      var admin = members[0];
      adminAv.textContent = getInitials(admin.name);
      adminName.textContent = admin.name;
      adminRole.textContent = admin.relation ? admin.relation.charAt(0).toUpperCase() + admin.relation.slice(1) : "Family Admin";
    } else {
      adminAv.textContent = "";
      adminName.textContent = "No members yet";
      adminRole.textContent = "Add your first family member";
    }

    if (!members.length) {
      grid.innerHTML = '<div class="fam-state">No members yet. Add your first family member below.</div>';
      return;
    }
    grid.innerHTML = "";
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

      const card = document.createElement("div");
      card.className = "glass member-card";
      card.dataset.id = String(m.id);
      card.innerHTML = `
        <button class="member-card-del" title="Remove">&times;</button>
        <div class="av-ring"><div class="av-inner" id="av-${m.id}">${esc(getInitials(m.name))}</div></div>
        <div class="member-card-name">${esc(m.name)}</div>
        <div class="member-card-relation">${esc(m.relation)}</div>`;
      card.addEventListener("click", (e) => {
        if (e.target.classList.contains("member-card-del")) return;
        selectFamily(String(m.id), m.name, color);
      });
      card.querySelector(".member-card-del").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteMember(String(m.id), m.name);
      });
      grid.appendChild(card);
    }

    const addCard = document.createElement("div");
    addCard.className = "glass member-card-add";
    addCard.innerHTML = '<div class="add-icon">+</div><div class="add-label">Add Member</div>';
    addCard.addEventListener("click", () => openMemberModal());
    grid.appendChild(addCard);

    // Restore selection if one was active
    if (selectedFamilyId) {
      const stillExists = members.find(m => String(m.id) === selectedFamilyId);
      if (stillExists) {
        syncMemberCards();
        return;
      }
    }
    selectFamily(String(members[0].id), members[0].name, AVATAR_COLORS[0]);
    loadMemberCardPhotos(members);
  } catch (err) {
    grid.innerHTML = '<div class="fam-state err">Failed to load.</div>';
  }
}

async function loadMemberCardPhotos(members) {
  let anyIncomplete = false;
  for (var i = 0; i < members.length; i++) {
    try {
      var res = await fetch("/api/profiles/" + members[i].id);
      if (res.ok) {
        var p = await res.json();
        if (p && p.profile_photo_url) {
          var avInner = document.getElementById("av-" + members[i].id);
          if (avInner) {
            avInner.innerHTML = '<img src="' + esc(p.profile_photo_url) + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
          }
        }
        var hasDetails = p && p.date_of_birth && p.gender && p.blood_group;
        if (!hasDetails) anyIncomplete = true;
      }
    } catch(e) {
      anyIncomplete = true;
    }
  }
  var banner = document.getElementById("dash-profile-prompt");
  if (banner) {
    banner.style.display = anyIncomplete ? "flex" : "none";
    if (anyIncomplete && members.length === 1) {
      document.getElementById("dash-prompt-title").textContent = "Complete your profile";
      document.getElementById("dash-prompt-sub").textContent = "Add date of birth, gender, and blood group to get the most out of Aegis.";
    } else if (anyIncomplete) {
      document.getElementById("dash-prompt-title").textContent = "Some details are missing";
      document.getElementById("dash-prompt-sub").textContent = "Add date of birth, gender, and blood group for all family members.";
    }
  }
}

function syncMemberCards() {
  document.querySelectorAll(".member-card").forEach(c =>
    c.classList.toggle("active", c.dataset.id === selectedFamilyId));
}

function selectFamily(id, name, color) {
  selectedFamilyId    = id;
  selectedMemberName  = name;
  selectedMemberColor = color;

  syncMemberCards();

  document.getElementById("dash-subtitle").textContent =
    "Health overview for " + name + ".";
  document.getElementById("dash-overview").style.display = "";

  pageLoaded = {};
  if (currentPage === "dashboard") {
    loadDashboard();
    pageLoaded["dashboard"] = true;
  } else {
    loadPage(currentPage);
    pageLoaded[currentPage] = true;
  }
}

function openMemberModal() {
  let modal = document.getElementById("member-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "member-modal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-head"><h3>Add Family Member</h3><button class="modal-close" onclick="closeMemberModal()">&times;</button></div>
        <form id="member-form">
          <label>Name
            <input type="text" id="member-name-input" required placeholder="e.g. Dad">
          </label>
          <label>Relation
            <input type="text" id="member-relation-input" required placeholder="e.g. Father, Mother, Self">
          </label>
          <button type="submit" class="btn btn-primary" style="margin-top:8px">Add Member</button>
        </form>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeMemberModal(); });
    document.getElementById("member-form").addEventListener("submit", handleAddMember);
  }
  modal.classList.add("open");
  document.getElementById("member-name-input").value = "";
  document.getElementById("member-relation-input").value = "";
  document.getElementById("member-name-input").focus();
}

function closeMemberModal() {
  const m = document.getElementById("member-modal");
  if (m) m.classList.remove("open");
}

async function handleAddMember(e) {
  e.preventDefault();
  const name = document.getElementById("member-name-input").value.trim();
  const relation = document.getElementById("member-relation-input").value;
  if (!name || !relation) return;
  try {
    const res = await fetch("/api/family_members", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ name, relation }),
    });
    if (!res.ok) throw new Error();
    closeMemberModal();
    loadFamilyMembers();
    toast("Member added.");
  } catch (err) {
    toast("Failed to add member.", "err");
  }
}

async function deleteMember(id, name) {
  if (!confirm("Remove " + name + "?")) return;
  try {
    const res = await fetch("/api/family_members/" + id, { method: "DELETE" });
    if (!res.ok) throw new Error();
    loadFamilyMembers();
    toast("Member removed.");
  } catch (err) {
    toast("Failed to remove member.", "err");
  }
}
