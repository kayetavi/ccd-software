import { supabase } from './supabase.js';

let activeCircuitId = null;

/* ===============================
   CALLED FROM circuits.js
================================ */
window.selectCircuitForDamage = async (circuitId) => {
  activeCircuitId = circuitId;

  document.getElementById("damageList").innerHTML =
    "<i>Loading damage mechanisms...</i>";

  await loadDamageMechanisms();
  await markSelectedDamages();
};

/* ===============================
   LOAD DAMAGE MASTER
================================ */
async function loadDamageMechanisms() {

  const { data, error } = await supabase
    .from('damage_mechanisms_master')
    .select('*')
    .order('name');

  if (error) {
    alert(error.message);
    return;
  }

  const div = document.getElementById("damageList");
  div.innerHTML = "";

  data.forEach(dm => {
    div.innerHTML += `
      <label style="display:block;margin-bottom:6px">
        <input type="checkbox"
          id="dm-${dm.id}"
          onchange="toggleDamage('${dm.id}', this.checked)">
        <b>${dm.name}</b>
        <small>(${dm.api_reference})</small>
      </label>
    `;
  });
}

/* ===============================
   LOAD EXISTING DAMAGE FOR CIRCUIT
================================ */
async function markSelectedDamages() {

  const { data } = await supabase
    .from('circuit_damage_map')
    .select('damage_mechanism_id')
    .eq('circuit_id', activeCircuitId);

  if (!data) return;

  data.forEach(row => {
    const cb = document.getElementById(`dm-${row.damage_mechanism_id}`);
    if (cb) cb.checked = true;
  });
}

/* ===============================
   TOGGLE DAMAGE
================================ */
window.toggleDamage = async (damageId, checked) => {

  if (!activeCircuitId) return;

  if (checked) {
    await supabase.from('circuit_damage_map').insert({
      circuit_id: activeCircuitId,
      damage_mechanism_id: damageId
    });
  } else {
    await supabase
      .from('circuit_damage_map')
      .delete()
      .eq('circuit_id', activeCircuitId)
      .eq('damage_mechanism_id', damageId);
  }
};
