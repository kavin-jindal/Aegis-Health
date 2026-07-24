/* ── UTILITIES ── */
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

function toast(msg, type = "") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show" + (type ? " " + type : "");
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = "toast"; }, 3000);
}

function getInitials(name) {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  return (name || "??").slice(0,2).toUpperCase();
}

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#8fae8b,#5a7d56)",
  "linear-gradient(135deg,#e0896a,#d4956b)",
  "linear-gradient(135deg,#7bb5c9,#5a9bb0)",
  "linear-gradient(135deg,#a89bc4,#8a7baa)",
  "linear-gradient(135deg,#d4a84b,#a8822e)",
  "linear-gradient(135deg,#7bb5c9,#8fae8b)",
];
