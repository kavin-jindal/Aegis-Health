/* ── DASHBOARD ── */
async function loadDashboard() {
  if (!selectedFamilyId) return;
  ["dash-followup-val","dash-meds-val","dash-steps-val","dash-emerg-val"]
    .forEach(id => { document.getElementById(id).textContent = "…"; });

  const [cRes, mRes, fRes, eRes] = await Promise.allSettled([
    fetch("/api/checkups?family_member_id=" + selectedFamilyId),
    fetch("/api/medicines?family_member_id=" + selectedFamilyId),
    fetch("/api/fitness?family_member_id="   + selectedFamilyId),
    fetch("/api/emergency?family_member_id=" + selectedFamilyId),
  ]);
  const today = new Date().toISOString().slice(0,10);

  /* follow-up */
  let nextFU = null;
  if (cRes.status==="fulfilled" && cRes.value.ok) {
    const c = await cRes.value.json();
    const f = c.filter(x => x.follow_up_date && x.follow_up_date >= today)
                .sort((a,b) => a.follow_up_date.localeCompare(b.follow_up_date));
    nextFU = f[0] || null;
  }
  if (nextFU) {
    const d = new Date(nextFU.follow_up_date + "T00:00:00");
    document.getElementById("dash-followup-val").textContent =
      d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
    document.getElementById("dash-followup-sub").textContent =
      nextFU.diagnosis ? esc(nextFU.diagnosis) : "Follow-up scheduled";
  } else {
    document.getElementById("dash-followup-val").textContent = "None";
    document.getElementById("dash-followup-sub").textContent = "No upcoming follow-ups";
  }

  /* medicines */
  let activeMeds = 0, totalMeds = 0;
  if (mRes.status==="fulfilled" && mRes.value.ok) {
    const m = await mRes.value.json();
    totalMeds  = m.length;
    activeMeds = m.filter(x => !x.end_date || x.end_date >= today).length;
  }
  document.getElementById("dash-meds-val").textContent = activeMeds;
  document.getElementById("dash-meds-sub").textContent =
    totalMeds > activeMeds
      ? (totalMeds - activeMeds) + " completed / inactive"
      : activeMeds === 0 ? "No medicines on record" : "All currently active";

  /* fitness */
  const FT = {steps:10000,calories:2000,water_ml:2000,sleep_hours:8};
  let todayLog = null;
  if (fRes.status==="fulfilled" && fRes.value.ok) {
    const logs = await fRes.value.json();
    todayLog = logs.find(l => l.log_date === today) || null;
  }
  const sv = todayLog ? (todayLog.steps||0) : 0;
  const cv = todayLog ? (todayLog.calories||0) : 0;
  const wv = todayLog ? (todayLog.water_ml||0) : 0;
  const slv= todayLog ? (todayLog.sleep_hours||0) : 0;

  document.getElementById("dash-steps-val").textContent = sv.toLocaleString();
  document.getElementById("dash-steps-sub").textContent = todayLog
    ? "of " + FT.steps.toLocaleString() + " target"
    : "Not logged today";

  const sp = (v,t) => { return Math.min(100, Math.round((v/t)*100)) + "%"; };
  document.getElementById("dm-steps-fill").style.width  = sp(sv,  FT.steps);
  document.getElementById("dm-cal-fill").style.width    = sp(cv,  FT.calories);
  document.getElementById("dm-water-fill").style.width  = sp(wv,  FT.water_ml);
  document.getElementById("dm-sleep-fill").style.width  = sp(slv, FT.sleep_hours);
  document.getElementById("dm-steps-val").textContent   = sv.toLocaleString();
  document.getElementById("dm-cal-val").textContent     = cv + " kcal";
  document.getElementById("dm-water-val").textContent   = wv + " ml";
  document.getElementById("dm-sleep-val").textContent   = slv + " hrs";

  /* emergency */
  let em = null;
  if (eRes.status==="fulfilled" && eRes.value.ok) em = await eRes.value.json();
  const hasBlood = em && em.blood_group;
  const hasCont  = em && em.emergency_contact_name;
  if (hasBlood && hasCont) {
    document.getElementById("dash-emerg-val").textContent = "Set up";
    document.getElementById("dash-emerg-sub").textContent =
      "Blood: " + esc(em.blood_group) + " · Contact saved";
  } else if (em && (hasBlood || em.allergies || em.conditions)) {
    document.getElementById("dash-emerg-val").textContent = "Partial";
    document.getElementById("dash-emerg-sub").textContent = "Some fields missing";
  } else {
    document.getElementById("dash-emerg-val").textContent = "Not set";
    document.getElementById("dash-emerg-sub").textContent = "Add emergency info";
  }
}
