/* ── ROUTER ── */
function navigateTo(pageId) {
  if (!PAGE_TITLES[pageId]) pageId = "dashboard";
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById("page-" + pageId);
  page.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(el =>
    el.classList.toggle("active", el.dataset.page === pageId));
  history.replaceState(null,"","#" + pageId);
  currentPage = pageId;

  // Move member grid into active page, after page-hd
  const grid = document.getElementById("member-grid");
  const hd = page.querySelector(".page-hd");
  if (hd && grid.parentElement !== hd) {
    hd.insertAdjacentElement("afterend", grid);
  }

  if (selectedFamilyId && !pageLoaded[pageId]) {
    loadPage(pageId);
    pageLoaded[pageId] = true;
  }
}

function loadPage(pageId) {
  const map = {
    dashboard: loadDashboard, doctors: loadDoctors,
    checkups:  loadCheckups,  medicines: loadMedicines,
    records:   loadRecords,   fitness: loadFitness,
    emergency: loadEmergencyInfo, assistant: loadChatHistory,
    reports: loadReports, profile: loadProfilePage, settings: loadSettingsPage,
  };
  map[pageId]?.();
}

window.addEventListener("hashchange", () => {
  const p = window.location.hash.slice(1);
  if (p && PAGE_TITLES[p]) navigateTo(p);
});
