import { supabase } from './supabase.js';

/* ===============================
   ACTIVE LOOP (DYNAMIC)
================================ */
let systemId = localStorage.getItem("active_loop");

/* ===============================
   DOM REFERENCES (SAFE)
================================ */
const circuitName = document.getElementById("circuitName");
const material = document.getElementById("material");
const temp = document.getElementById("temp");
const pressure = document.getElementById("pressure");
const circuits = document.getElementById("circuits");

/* ===============================
   ADD CIRCUIT
================================ */
window.addCircuit = async () => {

  systemId = localStorage.getItem("active_loop");
  if (!systemId) {
    alert("Please select a corrosion loop first");
    return;
  }

  const name = circuitName.value.trim();
  const mat = material.value.trim();
  const t = temp.value.trim();
  const p = pressure.value.trim();

  if (!name || !mat) {
    alert("Circuit name and material are required");
    return;
  }

  const { error } = await supabase
    .from('circuits')
    .insert({
      system_id: systemId,
      circuit_name: name,
      material: mat,
      operating_temp: t || null,
      operating_pressure: p || null
    });

  if (error) {
    alert(error.message);
    return;
  }

  // reset inputs
  circuitName.value = "";
  material.value = "";
  temp.value = "";
  pressure.value = "";

  loadCircuits();
};

/* ===============================
   LOAD CIRCUITS
================================ */
window.loadCircuits = async () => {

  systemId = localStorage.getItem("active_loop");
  if (!systemId || !circuits) return;

  const { data, error } = await supabase
    .from('circuits')
    .select('*')
    .eq('system_id', systemId)
    .order('created_at', { ascending: true });

  if (error) {
    alert(error.message);
    return;
  }

  circuits.innerHTML = "";

  // 🔒 hide damage section until circuit selected
  const damageSection = document.getElementById("damageSection");
  if (damageSection) damageSection.style.display = "none";

  if (!data || data.length === 0) {
    circuits.innerHTML = "<i>No circuits added yet</i>";
    return;
  }

  data.forEach(c => {
    circuits.innerHTML += `
      <div class="box">
        <b>${c.circuit_name}</b><br>
        Material: ${c.material}<br>
        Temp: ${c.operating_temp ?? "-"} °C |
        Pressure: ${c.operating_pressure ?? "-"} bar<br><br>

        <button onclick="selectCircuit('${c.id}')">
          Select Circuit
        </button>
      </div>
    `;
  });
};

/* ===============================
   SELECT CIRCUIT
================================ */
window.selectCircuit = (circuitId) => {
  if (!circuitId) return;

  // save active circuit
  localStorage.setItem("active_circuit", circuitId);

  // 🔥 step tracking (VERY IMPORTANT)
  localStorage.setItem("ccd_step", "damage");

  // show damage section
  const damageSection = document.getElementById("damageSection");
  if (damageSection) {
    damageSection.style.display = "block";
  }

  // notify damage.js
  if (window.selectCircuitForDamage) {
    window.selectCircuitForDamage(circuitId);
  }
};

/* ===============================
   INITIAL LOAD
================================ */
if (systemId) {
  loadCircuits();
}
