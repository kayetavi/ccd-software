import { supabase } from './supabase.js';

/* ===============================
   DOM REFERENCES
================================ */
const circuitName = document.getElementById("circuitName");
const material = document.getElementById("material");
const temp = document.getElementById("temp");
const pressure = document.getElementById("pressure");
const circuits = document.getElementById("circuits");

const processFluidSelect = document.getElementById("processFluidSelect");
const streamPhaseSelect = document.getElementById("streamPhaseSelect");
const inspectionList = document.getElementById("inspectionList");

/* ===============================
   LOAD MASTER DATA
================================ */
async function loadProcessFluids() {
  const { data, error } = await supabase
    .from("process_fluid_master")
    .select("id, name")
    .order("name");

  if (error) {
    alert(error.message);
    return;
  }

  processFluidSelect.innerHTML =
    `<option value="">-- Select Process Fluid --</option>`;

  data.forEach(f => {
    processFluidSelect.innerHTML +=
      `<option value="${f.id}">${f.name}</option>`;
  });
}

async function loadStreamPhases() {
  const { data, error } = await supabase
    .from("stream_phase_master")
    .select("id, name")
    .order("name");

  if (error) {
    alert(error.message);
    return;
  }

  streamPhaseSelect.innerHTML =
    `<option value="">-- Select Stream Phase --</option>`;

  data.forEach(p => {
    streamPhaseSelect.innerHTML +=
      `<option value="${p.id}">${p.name}</option>`;
  });
}

async function loadInspectionTechniques() {
  const { data, error } = await supabase
    .from("inspection_techniques")
    .select("id, name")
    .order("name");

  if (error) {
    alert(error.message);
    return;
  }

  inspectionList.innerHTML = "";

  data.forEach(i => {
    inspectionList.innerHTML += `
      <label style="display:block">
        <input type="checkbox" value="${i.id}">
        ${i.name}
      </label>
    `;
  });
}

/* ===============================
   ADD CIRCUIT
================================ */
window.addCircuit = async () => {

  const systemId = window.activeLoopId;
  if (!systemId) {
    alert("Please select a corrosion loop first");
    return;
  }

  const name = circuitName.value.trim();
  const mat = material.value.trim();
  const t = temp.value.trim();
  const p = pressure.value.trim();

  const processFluidId = processFluidSelect.value;
  const streamPhaseId = streamPhaseSelect.value;

  const selectedInspections = [
    ...inspectionList.querySelectorAll("input:checked")
  ].map(i => i.value);

  if (!name || !mat) {
    alert("Circuit name and material are required");
    return;
  }

  if (!processFluidId || !streamPhaseId) {
    alert("Please select Process Fluid and Stream Phase");
    return;
  }

  /* === INSERT CIRCUIT === */
  const { data: circuit, error } = await supabase
    .from('circuits')
    .insert({
      system_id: systemId,
      circuit_name: name,
      material: mat,
      operating_temp: t || null,
      operating_pressure: p || null,
      process_fluid_id: processFluidId,
      stream_phase_id: streamPhaseId
    })
    .select()
    .single();

  if (error) {
    alert("Failed to add circuit: " + error.message);
    return;
  }

  /* === INSERT INSPECTION TECHNIQUES === */
  for (const inspId of selectedInspections) {
    await supabase.from("circuit_inspections").insert({
      circuit_id: circuit.id,
      inspection_id: inspId
    });
  }

  /* === RESET FORM === */
  circuitName.value = "";
  material.value = "";
  temp.value = "";
  pressure.value = "";
  processFluidSelect.value = "";
  streamPhaseSelect.value = "";
  inspectionList
    .querySelectorAll("input")
    .forEach(i => i.checked = false);

  loadCircuits(systemId);
};

/* ===============================
   LOAD CIRCUITS
================================ */
window.loadCircuits = async (systemId = window.activeLoopId) => {

  if (!systemId || !circuits) return;

  const { data, error } = await supabase
    .from('circuits')
    .select(`
      id,
      circuit_name,
      material,
      operating_temp,
      operating_pressure,
      process_fluid_master ( name ),
      stream_phase_master ( name )
    `)
    .eq('system_id', systemId)
    .order('created_at');

  if (error) {
    alert("Failed to load circuits: " + error.message);
    return;
  }

  circuits.innerHTML = "";

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
        Pressure: ${c.operating_pressure ?? "-"} bar<br>
        Process Fluid: ${c.process_fluid_master?.name ?? "NA"}<br>
        Stream Phase: ${c.stream_phase_master?.name ?? "NA"}<br><br>

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

  window.activeCircuitId = circuitId;

  if (window.openTab) {
    window.openTab("damageSection");
  }

  if (window.selectCircuitForDamage) {
    window.selectCircuitForDamage(circuitId);
  }
};

/* ===============================
   INIT
================================ */
window.addEventListener("DOMContentLoaded", () => {
  loadProcessFluids();
  loadStreamPhases();
  loadInspectionTechniques();
});
