import { supabase } from './supabase.js';

/* ===============================
   PROJECT CONTEXT (PERSISTENT)
================================ */
export let currentProjectId = localStorage.getItem("active_project");

/* ===============================
   CREATE PROJECT
================================ */
window.createProject = async () => {
  const plant = document.getElementById("plant").value.trim();
  const unit = document.getElementById("unit").value.trim();

  if (!plant || !unit) {
    alert("Plant and Unit are required");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('ccd_projects')
    .insert({
      plant_name: plant,
      unit_name: unit,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  currentProjectId = data.id;
  localStorage.setItem("active_project", data.id);

  document.getElementById("projectStatus").innerText =
    `Project Active: ${plant} – ${unit}`;

  lockProjectInputs();
  loadSystems();   // load loops immediately
};

/* ===============================
   LOAD EXISTING PROJECT ON REFRESH
================================ */
window.addEventListener("DOMContentLoaded", async () => {
  if (!currentProjectId) return;

  const { data, error } = await supabase
    .from('ccd_projects')
    .select('*')
    .eq('id', currentProjectId)
    .single();

  if (error) {
    localStorage.removeItem("active_project");
    return;
  }

  document.getElementById("plant").value = data.plant_name;
  document.getElementById("unit").value = data.unit_name;

  document.getElementById("projectStatus").innerText =
    `Project Active: ${data.plant_name} – ${data.unit_name}`;

  lockProjectInputs();
  loadSystems();
});

/* ===============================
   LOCK PROJECT SECTION
================================ */
function lockProjectInputs() {
  document.getElementById("plant").disabled = true;
  document.getElementById("unit").disabled = true;
}

/* ===============================
   LOAD SYSTEMS (CALLED FROM systems.js)
================================ */
window.loadSystems = async () => {
  if (!currentProjectId) return;

  const { data } = await supabase
    .from('corrosion_systems')
    .select('*')
    .eq('project_id', currentProjectId)
    .order('created_at', { ascending: true });

  const container = document.getElementById("systems");
  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = "<i>No loops added yet</i>";
    return;
  }

  data.forEach(sys => {
    container.innerHTML += `
      <div class="box">
        <b>${sys.system_name}</b><br>
        <small>${sys.process_description || ""}</small><br><br>
        <button onclick="openLoop('${sys.id}')">OPEN</button>
      </div>
    `;
  });
};

/* ===============================
   OPEN LOOP (GO TO CIRCUIT PAGE)
================================ */
window.openLoop = (loopId) => {
  localStorage.setItem("active_loop", loopId);
  location.href = "loop.html";
};
