import { supabase } from './supabase.js';
import { currentProjectId } from './dashboard.js';

/* ===============================
   DOM REFERENCES
================================ */
const systemName = document.getElementById("systemName");
const systemDesc = document.getElementById("systemDesc");
const systemsDiv = document.getElementById("systems");
const activeLoopLabel = document.getElementById("activeLoopLabel");

/* ---- Loop Constituents Inputs ---- */
const h2s = document.getElementById("h2s");
const co2 = document.getElementById("co2");
const o2 = document.getElementById("o2");
const chlorides = document.getElementById("chlorides");
const constituentStatus = document.getElementById("constituentStatus");

/* ===============================
   LOAD CORROSION LOOPS
================================ */
window.loadSystems = async () => {

  if (!currentProjectId) return;

  const { data, error } = await supabase
    .from("corrosion_systems")
    .select(`
      id,
      system_name,
      process_description
    `)
    .eq("project_id", currentProjectId)
    .order("created_at");

  if (error) {
    alert(error.message);
    return;
  }

  systemsDiv.innerHTML = "";

  if (!data || data.length === 0) {
    systemsDiv.innerHTML = "<i>No corrosion loops created yet</i>";
    return;
  }

  data.forEach(loop => {
    systemsDiv.innerHTML += `
      <div class="box">
        <b>${loop.system_name}</b><br>
        ${loop.process_description || ""}<br><br>

        <button onclick="openLoop('${loop.id}', '${loop.system_name}')">
          Open Loop
        </button>

        <button style="margin-left:5px"
          onclick="deleteLoop('${loop.id}')">
          ❌ Delete
        </button>
      </div>
    `;
  });
};

/* ===============================
   ADD CORROSION LOOP
================================ */
window.addSystem = async () => {

  if (!currentProjectId) {
    alert("Please create/select a CCD project first");
    return;
  }

  const name = systemName.value.trim();
  const desc = systemDesc.value.trim();

  if (!name) {
    alert("Loop / System name is required");
    return;
  }

  const { error } = await supabase
    .from("corrosion_systems")
    .insert({
      project_id: currentProjectId,
      system_name: name,
      process_description: desc || null
    });

  if (error) {
    alert("Failed to add loop: " + error.message);
    return;
  }

  systemName.value = "";
  systemDesc.value = "";

  loadSystems();
};

/* ===============================
   OPEN LOOP
================================ */
window.openLoop = async (loopId, loopName) => {

  if (!loopId) return;

  /* ✅ Active Loop (GLOBAL) */
  window.activeLoopId = loopId;

  /* UI label */
  if (activeLoopLabel) {
    activeLoopLabel.innerText = loopName || "Selected";
  }

  /* Load Loop Constituents */
  const { data } = await supabase
    .from("loop_constituents")
    .select("*")
    .eq("system_id", loopId)
    .single();

  h2s.value = data?.h2s ?? "";
  co2.value = data?.co2 ?? "";
  o2.value = data?.o2 ?? "";
  chlorides.value = data?.chlorides ?? "";
  constituentStatus.innerText = "";

  /* Open Circuits tab */
  if (window.openTab) {
    window.openTab("circuitSection");
  }

  /* Hide Damage & Report */
  const damageSection = document.getElementById("damageSection");
  const reportSection = document.getElementById("reportSection");

  if (damageSection) damageSection.style.display = "none";
  if (reportSection) reportSection.style.display = "none";

  /* Load Circuits */
  if (window.loadCircuits) {
    window.loadCircuits(loopId);
  }
};

/* ===============================
   SAVE LOOP CONSTITUENTS
================================ */
window.saveLoopConstituents = async () => {

  if (!window.activeLoopId) {
    alert("Please select a corrosion loop first");
    return;
  }

  const payload = {
    system_id: window.activeLoopId,
    h2s: h2s.value || null,
    co2: co2.value || null,
    o2: o2.value || null,
    chlorides: chlorides.value || null
  };

  const { error } = await supabase
    .from("loop_constituents")
    .upsert(payload, { onConflict: "system_id" });

  constituentStatus.innerText = error
    ? `❌ ${error.message}`
    : "✅ Constituents saved successfully";
};

/* ===============================
   DELETE LOOP
================================ */
window.deleteLoop = async (loopId) => {

  if (!confirm("Delete this loop and all circuits inside it?")) return;

  const { error } = await supabase
    .from("corrosion_systems")
    .delete()
    .eq("id", loopId);

  if (error) {
    alert(error.message);
    return;
  }

  if (window.activeLoopId === loopId) {
    window.activeLoopId = null;
    activeLoopLabel.innerText = "None";
  }

  loadSystems();
};
