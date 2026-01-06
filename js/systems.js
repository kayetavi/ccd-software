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

  // 🔥 reload loop list (function lives in dashboard.js)
  loadSystems();
};

/* ===============================
   OPEN LOOP (SELECT LOOP)
================================ */
window.openLoop = (loopId) => {
  // active loop = selected corrosion system
  localStorage.setItem("active_loop", loopId);

  // go to loop page (circuits + damage)
  location.href = "loop.html";
};

/* ===============================
   DOM REFERENCES
================================ */
const systemName = document.getElementById("systemName");
const systemDesc = document.getElementById("systemDesc");
