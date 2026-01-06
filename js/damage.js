import { supabase } from './supabase.js';

let activeCircuitId = null;

/* ===============================
   LOAD DAMAGE MECHANISMS MASTER
================================ */
async function loadDamageMechanisms() {
  const { data } = await supabase
    .from('damage_mechanisms_master')
    .select('*')
    .order('name');

  const div = document.getElementById("damageList");
  div.innerHTML = "";

  data.forEach(dm => {
    div.innerHTML += `
      <label>
        <input type="checkbox"
          onchange="toggleDamage('${dm.id}', this.checked)">
        <b>${dm.name}</b>
        <small>(${dm.api_reference})</small>
      </label><br>
    `;
  });
}

/* ===============================
   SELECT CIRCUIT
================================ */
window.selectCircuit = async (circuitId) => {
  activeCircuitId = circuitId;
  loadDamageMechanisms();
};

/* ===============================
   ADD / REMOVE DAMAGE
================================ */
window.toggleDamage = async (damageId, checked) => {
  if (!activeCircuitId) {
    alert("Select a circuit first");
    return;
  }

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
