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
    alert(error.message);
    return;
  }

  // clear inputs
  systemName.value = "";
  systemDesc.value = "";

  // reload loop list (safe)
  if (window.loadSystems) {
    window.loadSystems();
  }
};

/* ===============================
   OPEN LOOP (SAME DASHBOARD)
================================ */
window.openLoop = (loopId) => {

  if (!loopId) return;

  // ✅ save active loop
  localStorage.setItem("active_loop", loopId);

  // ✅ show CIRCUITS section
  const circuitSection = document.getElementById("circuitSection");
  if (circuitSection) {
    circuitSection.style.display = "block";
    circuitSection.scrollIntoView({ behavior: "smooth" });
  }

  // reset DAMAGE & REPORT until circuit selected
  const damageSection = document.getElementById("damageSection");
  const reportSection = document.getElementById("reportSection");

  if (damageSection) damageSection.style.display = "none";
  if (reportSection) reportSection.style.display = "none";

  // clear old data (optional but recommended)
  localStorage.removeItem("active_circuit");

  // load circuits for this loop
  if (window.loadCircuits) {
    window.loadCircuits();
  }
};

/* ===============================
   DOM REFERENCES
================================ */
const systemName = document.getElementById("systemName");
const systemDesc = document.getElementById("systemDesc");
