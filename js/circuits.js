import { supabase } from './supabase.js';

/* ===============================
   ACTIVE LOOP (SYSTEM)
================================ */
const systemId = localStorage.getItem("active_loop");

if (!systemId) {
  alert("No active loop selected");
}

/* ===============================
   ADD CIRCUIT
================================ */
window.addCircuit = async () => {

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

  // clear inputs
  circuitName.value = "";
  material.value = "";
  temp.value = "";
  pressure.value = "";

  loadCircuits();
};

/* ===============================
   LOAD CIRCUITS
================================ */
async function loadCircuits() {
  if (!systemId) return;

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
        Pressure: ${c.operating_pressure ?? "-"}<br><br>

        <button onclick="selectCircuit('${c.id}')">
          Select Circuit
        </button>
      </div>
    `;
  });
}

/* ===============================
   SELECT CIRCUIT (FOR DAMAGE)
================================ */
window.selectCircuit = (circuitId) => {
  localStorage.setItem("active_circuit", circuitId);

  // inform damage module
  if (window.selectCircuitForDamage) {
    window.selectCircuitForDamage(circuitId);
  }
};

/* ===============================
   INITIAL LOAD
================================ */
loadCircuits();

/* ===============================
   DOM REFERENCES
================================ */
const circuitName = document.getElementById("circuitName");
const material = document.getElementById("material");
const temp = document.getElementById("temp");
const pressure = document.getElementById("pressure");
const circuits = document.getElementById("circuits");
