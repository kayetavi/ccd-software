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

/* ---- Critical Process Constituents ---- */
const h2s = document.getElementById("h2s");
const co2 = document.getElementById("co2");
const o2 = document.getElementById("o2");
const chlorides = document.getElementById("chlorides");
const constituentStatus = document.getElementById("constituentStatus");

/* ===============================
   LOAD MASTER DATA
================================ */
async function loadProcessFluids() {
  const { data, error } = await supabase
    .from("process_fluid_master")
    .select("id, name")
    .order("name");

  if (error) return alert(error.message);

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

  if (error) return alert(error.message);

  streamPhaseSelect.innerHTML =
    `<option value="">-- Select Stream Phase --</option>`;

  data.forEach(p => {
    streamPhaseSelect.innerHTML +=
      `<option value="${p.id}">${p.name}</option>`;
  });
}

async function loadInspectionTechniques() {
  const { data, error } = await supabase
    .from("inspection_techniques_master")
    .select("id, technique, category")
    .order("technique");

  if (error) return alert(error.message);

  inspectionList.innerHTML = "";

  data.forEach(i => {
    inspectionList.innerHTML += `
      <label style="display:block">
        <input type="checkbox" value="${i.id}">
        ${i.technique} (${i.category})
      </label>
    `;
  });
}

/* ===============================
   ADD CIRCUIT
================================ */
window.addCircuit = async () => {

  if (!window.activeLoopId) {
    alert("❌ Select corrosion loop first");
    return;
  }

  if (!circuitName.value || !material.value) {
    alert("❌ Circuit name & material required");
    return;
  }

  const { data: circuit, error } = await supabase
    .from("circuits")
    .insert({
      system_id: window.activeLoopId,
      circuit_name: circuitName.value.trim(),
      material: material.value.trim(),
      operating_temp: temp.value || null,
      operating_pressure: pressure.value || null,
      process_fluid_id: processFluidSelect.value,
      stream_phase_id: streamPhaseSelect.value
    })
    .select()
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  /* SAVE INSPECTION TECHNIQUES */
  const selectedInspections =
    [...inspectionList.querySelectorAll("input:checked")]
      .map(i => i.value);

  for (const id of selectedInspections) {
    await supabase.from("circuit_inspections").insert({
      circuit_id: circuit.id,
      inspection_technique_id: id
    });
  }

  /* RESET FORM */
  circuitName.value = "";
  material.value = "";
  temp.value = "";
  pressure.value = "";
  processFluidSelect.value = "";
  streamPhaseSelect.value = "";
  inspectionList.querySelectorAll("input").forEach(i => i.checked = false);

  loadCircuits(window.activeLoopId);
};

/* ===============================
   LOAD CIRCUITS
================================ */
window.loadCircuits = async (systemId = window.activeLoopId) => {

  if (!systemId) return;

  const { data, error } = await supabase
    .from("circuits")
    .select(`
      id,
      circuit_name,
      material,
      operating_temp,
      operating_pressure,
      process_fluid_master ( name ),
      stream_phase_master ( name )
    `)
    .eq("system_id", systemId)
    .order("created_at");

  if (error) return alert(error.message);

  circuits.innerHTML = data.length
    ? data.map(c => `
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
    `).join("")
    : "<i>No circuits added yet</i>";
};

/* ===============================
   SELECT CIRCUIT
================================ */
window.selectCircuit = async (circuitId) => {

  window.activeCircuitId = circuitId;

  /* LOAD CONSTITUENTS */
  const { data } = await supabase
    .from("circuit_constituents")
    .select("h2s, co2, o2, chlorides")
    .eq("circuit_id", circuitId)
    .single();

  h2s.value = data?.h2s ?? "";
  co2.value = data?.co2 ?? "";
  o2.value = data?.o2 ?? "";
  chlorides.value = data?.chlorides ?? "";

  window.openTab("damageSection");
  window.selectCircuitForDamage?.(circuitId);
};

/* ===============================
   SAVE CONSTITUENTS
================================ */
window.saveConstituents = async () => {

  if (!window.activeCircuitId) {
    alert("❌ Select circuit first");
    return;
  }

  const payload = {
    circuit_id: window.activeCircuitId,
    h2s: h2s.value || null,
    co2: co2.value || null,
    o2: o2.value || null,
    chlorides: chlorides.value || null
  };

  const { error } = await supabase
    .from("circuit_constituents")
    .upsert(payload, { onConflict: "circuit_id" });

  constituentStatus.innerText = error
    ? `❌ ${error.message}`
    : "✅ Constituents saved successfully";
};

/* ===============================
   INIT
================================ */
window.addEventListener("DOMContentLoaded", () => {
  loadProcessFluids();
  loadStreamPhases();
  loadInspectionTechniques();
});
