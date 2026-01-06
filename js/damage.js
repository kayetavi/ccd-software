import { supabase } from './supabase.js';

/* ===============================
   ACTIVE CIRCUIT (DYNAMIC)
================================ */
let activeCircuitId = localStorage.getItem("active_circuit");

/* ===============================
   LOAD DAMAGE MASTER
================================ */
window.loadDamageMechanisms = async () => {

  const { data: master, error } = await supabase
    .from('damage_mechanisms_master')
    .select('*')
    .order('name');

  if (error) {
    alert(error.message);
    return;
  }

  const container = document.getElementById("damageList");
  container.innerHTML = "";

  if (!master || master.length === 0) {
    container.innerHTML = "<i>No damage mechanisms configured</i>";
    return;
  }

  // Load already mapped damage for circuit
  let selected = [];
  if (activeCircuitId) {
    const res = await supabase
      .from('circuit_damage_map')
      .select('damage_mechanism_id')
      .eq('circuit_id', activeCircuitId);

    selected = res.data?.map(d => d.damage_mechanism_id) || [];
  }

  master.forEach(dm => {
    const checked = selected.includes(dm.id) ? "checked" : "";

    container.innerHTML += `
      <label style="display:block;margin-bottom:6px">
        <input type="checkbox"
          ${checked}
          onchange="toggleDamage('${dm.id}', this.checked)">
        <b>${dm.name}</b>
        <small>(${dm.api_reference || "API"})</small>
      </label>
    `;
  });
};

/* ===============================
   CALLED FROM circuits.js
================================ */
window.selectCircuitForDamage = (circuitId) => {
  activeCircuitId = circuitId;
  localStorage.setItem("active_circuit", circuitId);

  // show damage section
  const section = document.getElementById("damageSection");
  if (section) section.style.display = "block";

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
    const { error } = await supabase
      .from('circuit_damage_map')
      .insert({
        circuit_id: activeCircuitId,
        damage_mechanism_id: damageId
      });

    if (error) alert(error.message);

  } else {
    const { error } = await supabase
      .from('circuit_damage_map')
      .delete()
      .eq('circuit_id', activeCircuitId)
      .eq('damage_mechanism_id', damageId);

    if (error) alert(error.message);
  }
};

/* ===============================
   AUTO LOAD ON REFRESH
================================ */
if (activeCircuitId) {
  loadDamageMechanisms();
}
