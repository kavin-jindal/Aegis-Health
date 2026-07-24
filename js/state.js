/* ── STATE ── */
let selectedFamilyId    = null;
let selectedMemberName  = "";
let selectedMemberColor = AVATAR_COLORS[0];
let currentPage         = "dashboard";
let pageLoaded          = {};

const PAGE_TITLES = {
  dashboard:"Dashboard", doctors:"Doctors", checkups:"Checkups",
  medicines:"Medicines", records:"Medical Records", fitness:"Fitness Goals",
  prices:"Price Comparison", emergency:"Emergency Info", assistant:"AI Assistant",
  reports:"Reports", profile:"Member Profile", settings:"Settings",
};
