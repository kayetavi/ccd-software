import { supabase } from './supabase.js';
import { currentProjectId } from './dashboard.js';

/* ===============================
   ADD CORROSION LOOP / SYSTEM
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
    .from('corrosion_systems')
    .insert({
      project_id: currentProjectId,
      system_name: name,
      process_description: desc || null
    });

  if (error) {
    alert("Failed to add loop: " + error.message);
    return;
  }

  // clear inputs
  systemName.value = "";
  systemDesc.value = "";

  // reload loops from Supabase
  if (window.loadSystems) {
    window.loadSystems();
  }
};

/* ===============================
   OPEN LOOP (SUPABASE FLOW)
================================ */
window.openLoop = (loopId) => {

  if (!loopId) return;

  // ✅ in-memory active loop (NOT localStorage)
  window.activeLoopId = loopId;

  // open Circuits tab
  if (window.openTab) {
    window.openTab("circuitSection");
  }

  // hide damage & report until circuit selected
  const damageSection = document.getElementById("damageSection");
  const reportSection = document.getElementById("reportSection");

  if (damageSection) damageSection.style.display = "none";
  if (reportSection) reportSection.style.display = "none";

  // load circuits for selected loop
  if (window.loadCircuits) {
    window.loadCircuits(loopId);
  }
};

/* ===============================
   DOM REFERENCES
================================ */
const systemName = document.getElementById("systemName");
const systemDesc = document.getElementById("systemDesc");


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

  loadSystems();
};

