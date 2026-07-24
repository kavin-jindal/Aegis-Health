/* ── INIT ── */
document.addEventListener("DOMContentLoaded", () => {
  createModals();
  const hash = window.location.hash.slice(1);
  const valid = Object.keys(PAGE_TITLES);
  navigateTo(valid.includes(hash) ? hash : "dashboard");
  loadFamilyMembers();
});
