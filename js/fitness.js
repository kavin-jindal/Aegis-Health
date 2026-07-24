/* ── FITNESS ── */
const FITNESS_TARGETS = {steps:10000,calories:2000,water_ml:2000,sleep_hours:8};
let fitnessCache = [];
async function loadFitness() {
  const el   = document.getElementById("fitness-list");
  const prog = document.getElementById("fitness-progress");
  if (!selectedFamilyId) { el.innerHTML=""; return; }
  const today = new Date().toISOString().slice(0,10);
  document.getElementById("fit-date").value = today;
  prog.innerHTML='<div class="progress-block-title">Today\'s Progress</div><div class="state-box state-loading" style="padding:10px 0"><p>Loading…</p></div>';
  el.innerHTML='<div class="state-box state-loading"><p>Loading…</p></div>';
  try {
    const res = await fetch("/api/fitness?family_member_id="+selectedFamilyId);
    if (!res.ok) throw new Error();
    fitnessCache = await res.json();
    const todayLog = fitnessCache.find(l=>l.log_date===today);
    if (todayLog) {
      document.getElementById("fit-steps").value    = todayLog.steps||"";
      document.getElementById("fit-calories").value = todayLog.calories||"";
      document.getElementById("fit-water").value    = todayLog.water_ml||"";
      document.getElementById("fit-sleep").value    = todayLog.sleep_hours||"";
    } else {
      ["fit-steps","fit-calories","fit-water","fit-sleep"].forEach(id=>document.getElementById(id).value="");
    }
    renderFitnessProgress(todayLog||{}); renderFitnessList();
  } catch(err) {
    prog.innerHTML='<div class="state-box state-error"><p>Failed to load fitness data.</p></div>';
    el.innerHTML="";
  }
}
function renderFitnessProgress(log) {
  const prog = document.getElementById("fitness-progress");
  const metrics = [
    {label:"Steps",    val:log.steps||0,       target:FITNESS_TARGETS.steps,       unit:"",    fill:"fill-sage",    icon:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'},
    {label:"Calories", val:log.calories||0,    target:FITNESS_TARGETS.calories,    unit:"kcal",fill:"fill-amber",   icon:'<path d="M12 2a10 10 0 1 0 10 10"/>'},
    {label:"Water",    val:log.water_ml||0,    target:FITNESS_TARGETS.water_ml,    unit:"ml",  fill:"fill-sky",     icon:'<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'},
    {label:"Sleep",    val:log.sleep_hours||0, target:FITNESS_TARGETS.sleep_hours, unit:"hrs", fill:"fill-lavender",icon:'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'},
  ];
  prog.innerHTML = '<div class="progress-block-title">Today\'s Progress</div>' +
    metrics.map(m=>{
      const pct = Math.min(100,Math.round((m.val/m.target)*100));
      return `<div class="prog-item">
        <div class="prog-hd">
          <span class="prog-name"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${m.icon}</svg>${m.label}</span>
          <span class="prog-vals">${m.val.toLocaleString()} / ${m.target.toLocaleString()} ${m.unit}</span>
        </div>
        <div class="prog-track"><div class="prog-fill ${m.fill}" style="width:${pct}%"></div></div>
      </div>`;
    }).join("");
}
function renderFitnessList() {
  const el = document.getElementById("fitness-list");
  document.getElementById("fit-count").textContent = Math.min(fitnessCache.length,14);
  if (!fitnessCache.length) {
    el.innerHTML='<div class="state-box state-empty"><p>No fitness logs yet.</p></div>';
    return;
  }
  el.innerHTML = '<ul class="data-list">' + fitnessCache.slice(0,14).map(l=>`
    <li class="data-item">
      <div class="item-icon ii-sage">
        <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <div class="data-item-body" onclick="showItemDetail('fitness','${l.id}')" style="cursor:pointer">
        <div class="di-title">${esc(l.log_date)}</div>
        <div class="di-meta">${l.steps||0} steps \u00b7 ${l.calories||0} kcal \u00b7 ${l.water_ml||0} ml \u00b7 ${l.sleep_hours||0} hrs</div>
      </div>
      <div class="data-item-actions">
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();editFitnessLog('${l.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteFitnessLog('${l.id}')">Delete</button>
      </div>
    </li>`).join("") + '</ul>';
}
async function saveFitnessLog() {
  const body = {
    family_member_id: selectedFamilyId,
    log_date:    document.getElementById("fit-date").value,
    steps:       parseInt(document.getElementById("fit-steps").value)||null,
    calories:    parseInt(document.getElementById("fit-calories").value)||null,
    water_ml:    parseInt(document.getElementById("fit-water").value)||null,
    sleep_hours: parseFloat(document.getElementById("fit-sleep").value)||null,
  };
  if (!body.log_date) { document.getElementById("fit-form-err").textContent="Date required."; return; }
  document.getElementById("fit-form-err").textContent="";
  try {
    const res = await fetch("/api/fitness",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    if (!res.ok) throw new Error();
    toast("Fitness log saved.","ok"); loadFitness();
  } catch(err) {
    document.getElementById("fit-form-err").textContent="Save failed.";
    toast("Failed to save log.","err");
  }
}
function editFitnessLog(id) { openFitnessModal(id); }
async function deleteFitnessLog(id) {
  if (!confirm("Delete this log?")) return;
  try {
    const res = await fetch("/api/fitness/"+id,{method:"DELETE"});
    if (!res.ok) throw new Error();
    toast("Log deleted.","ok"); loadFitness();
  } catch(err) { toast("Failed to delete log.","err"); }
}
