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
      process_description: desc
    });

  if (error) {
    alert(error.message);
    return;
  }

  // clear inputs
  systemName.value = "";
  systemDesc.value = "";

  // reload loop list
  loadSystems();
};

/* ===============================
   OPEN LOOP (NO REDIRECT)
================================ */
window.openLoop = (loopId) => {

  // ✅ save active loop
  localStorage.setItem("active_loop", loopId);

  // ✅ SHOW CIRCUIT SECTION (same dashboard)
  const circuitSection = document.getElementById("circuitSection");
  if (circuitSection) {
    circuitSection.style.display = "block";
    circuitSection.scrollIntoView({ behavior: "smooth" });
  }

  // OPTIONAL: hide damage & report until circuit selected
  const damageSection = document.getElementById("damageSection");
  const reportSection = document.getElementById("reportSection");

  if (damageSection) damageSection.style.display = "none";
  if (reportSection) reportSection.style.display = "none";

  // OPTIONAL: load circuits immediately
  if (window.loadCircuits) {
    window.loadCircuits();
  }
};

/* ===============================
   DOM REFERENCES
================================ */
const systemName = document.getElementById("systemName");
const systemDesc = document.getElementById("systemDesc");
