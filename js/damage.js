import { supabase } from './supabase.js';

let activeCircuitId = null;

/* ===============================
   CALLED FROM circuits.js
================================ */
window.selectCircuitForDamage = async (circuitId) => {

  if (!circuitId) {
    console.warn("No circuit id received");
    return;
  }

  activeCircuitId = circuitId;

  // 🔥 SHOW DAMAGE SECTION
  const section = document.getElementById("damageSection");
  if (section) section.style.display = "block";

  const div = document.getElementById("damageList");
  if (!div) {
    alert("damageList div missing in HTML");
    return;
  }

  div.innerHTML = `
    <b>Damage Mechanisms for Selected Circuit</b><br><br>
    <i>Loading damage mechanisms...</i>
  `;

  hideDamageSummary();

  await loadDamageMechanisms();

  // ✅ IMPORTANT: wait for DOM render
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

  if (!data || data.length === 0) {
    div.innerHTML = "<i>No damage mechanisms found in master table</i>";
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
   LOAD EXISTING DAMAGE FOR CIRCUIT
================================ */
async function markSelectedDamages() {

  if (!activeCircuitId) return;

  const { data, error } = await supabase
    .from('circuit_damage_map')
    .select('damage_mechanism_id')
    .eq('circuit_id', activeCircuitId);

  if (error || !data) return;

  data.forEach(row => {
    const cb = document.getElementById(`dm-${row.damage_mechanism_id}`);
    if (cb) cb.checked = true;
  });
}


/* ===============================
   TOGGLE DAMAGE
================================ */
window.toggleDamage = async (damageId, checked) => {

  if (!activeCircuitId || !damageId) return;

  if (checked) {
    const { error } = await supabase
      .from('circuit_damage_map')
      .insert({
        circuit_id: activeCircuitId,
        damage_mechanism_id: damageId
      });

    if (error) {
      alert(error.message);
      return;
    }

  } else {
    const { error } = await supabase
      .from('circuit_damage_map')
      .delete()
      .eq('circuit_id', activeCircuitId)
      .eq('damage_mechanism_id', damageId);

    if (error) {
      alert(error.message);
      return;
    }
  }

  await refreshDamageSummary();
};


/* ===============================
   DAMAGE SUMMARY
================================ */
async function refreshDamageSummary() {

  const summaryBox = document.getElementById("damageSummary");
  const list = document.getElementById("damageSummaryList");

  if (!summaryBox || !list || !activeCircuitId) return;

  const { data, error } = await supabase
    .from('circuit_damage_map')
    .select(`
      damage_mechanisms_master ( name )
    `)
    .eq('circuit_id', activeCircuitId);

  if (error || !data || data.length === 0) {
    hideDamageSummary();
    return;
  }

  list.innerHTML = "";
  data.forEach(row => {
    list.innerHTML += `<li>${row.damage_mechanisms_master.name}</li>`;
  });

  summaryBox.style.display = "block";
}

function hideDamageSummary() {
  const summaryBox = document.getElementById("damageSummary");
  const list = document.getElementById("damageSummaryList");

  if (summaryBox) summaryBox.style.display = "none";
  if (list) list.innerHTML = "";
}
