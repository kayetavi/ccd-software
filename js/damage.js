import { supabase } from './supabase.js';

/* ===============================
   ACTIVE CIRCUIT (IN-MEMORY)
================================ */
window.activeCircuitId = null;

/* ===============================
   CALLED FROM circuits.js
================================ */
window.selectCircuitForDamage = async (circuitId) => {

  if (!circuitId) return;

  window.activeCircuitId = circuitId;

  // ✅ OPEN DAMAGE TAB ONLY
  if (window.openTab) {
    window.openTab("damageSection");
  }

  const div = document.getElementById("damageList");
  if (!div) return;

  div.innerHTML = `
    <b>Damage Mechanisms for Selected Circuit</b><br><br>
    <i>Loading damage mechanisms...</i>
  `;

  hideDamageSummary();
  hideReportSection();

  await loadDamageMechanisms();
  await new Promise(requestAnimationFrame);
  await markSelectedDamages();
  await refreshDamageSummary();
};


/* ===============================
   LOAD DAMAGE MASTER
================================ */
async function loadDamageMechanisms() {

  const { data, error } = await supabase
    .from('damage_mechanisms_master')
    .select('*')
    .order('name');

  const div = document.getElementById("damageList");
  if (!div) return;

  if (error) {
    div.innerHTML = `<span style="color:red">${error.message}</span>`;
    return;
  }

  div.innerHTML = "";

  data.forEach(dm => {
    div.innerHTML += `
      <label style="display:block;margin-bottom:6px;cursor:pointer">
        <input type="checkbox"
          id="dm-${dm.id}"
          onchange="toggleDamage('${dm.id}', this.checked)">
        <b>${dm.name}</b>
        <small>(${dm.api_reference || "API 571"})</small>
      </label>
    `;
  });
}


/* ===============================
   LOAD EXISTING DAMAGE
================================ */
async function markSelectedDamages() {

  if (!window.activeCircuitId) return;

  const { data } = await supabase
    .from('circuit_damage_map')
    .select('damage_mechanism_id')
    .eq('circuit_id', window.activeCircuitId);

  if (!data) return;

  data.forEach(row => {
    const cb = document.getElementById(`dm-${row.damage_mechanism_id}`);
    if (cb) cb.checked = true;
  });
}


/* ===============================
   TOGGLE DAMAGE (NO REDIRECT)
================================ */
window.toggleDamage = async (damageId, checked) => {

  if (!window.activeCircuitId) return;

  if (checked) {
    await supabase.from('circuit_damage_map').insert({
      circuit_id: window.activeCircuitId,
      damage_mechanism_id: damageId
    });
  } else {
    await supabase.from('circuit_damage_map')
      .delete()
      .eq('circuit_id', window.activeCircuitId)
      .eq('damage_mechanism_id', damageId);
  }

  await refreshDamageSummary();
};


/* ===============================
   DAMAGE SUMMARY
================================ */
async function refreshDamageSummary() {

  const box = document.getElementById("damageSummary");
  const list = document.getElementById("damageSummaryList");

  if (!box || !list || !window.activeCircuitId) return;

  const { data } = await supabase
    .from('circuit_damage_map')
    .select(`damage_mechanisms_master ( name )`)
    .eq('circuit_id', window.activeCircuitId);

  if (!data || data.length === 0) {
    hideDamageSummary();
    return;
  }

  list.innerHTML = "";
  data.forEach(d =>
    list.innerHTML += `<li>${d.damage_mechanisms_master.name}</li>`
  );

  box.style.display = "block";
}


/* ===============================
   HELPERS
================================ */
function hideReportSection() {
  const r = document.getElementById("reportSection");
  if (r) r.style.display = "none";
}

function hideDamageSummary() {
  const b = document.getElementById("damageSummary");
  const l = document.getElementById("damageSummaryList");
  if (b) b.style.display = "none";
  if (l) l.innerHTML = "";
}
