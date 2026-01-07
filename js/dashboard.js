import { supabase } from './supabase.js';

/* ===============================
   GLOBAL STATE (IN-MEMORY ONLY)
================================ */
export let currentProjectId = null;
window.activeLoopId = null;
window.activeCircuitId = null;

/* ===============================
   CREATE PROJECT (NO DELETE)
================================ */
window.createProject = async () => {
  const plant = document.getElementById("plant")?.value.trim();
  const unit = document.getElementById("unit")?.value.trim();

  if (!plant || !unit) {
    alert("Plant and Unit are required");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("User not logged in");
    return;
  }

  const { data, error } = await supabase
    .from("ccd_projects")
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

  activateProject(data);
  loadProjectList(); // 🔥 refresh list
};

/* ===============================
   ACTIVATE PROJECT (CORE)
================================ */
function activateProject(project) {
  currentProjectId = project.id;

  document.getElementById("plant").value = project.plant_name;
  document.getElementById("unit").value = project.unit_name;

  document.getElementById("projectStatus").innerText =
    `Project Active: ${project.plant_name} – ${project.unit_name}`;

  lockProjectInputs();
  resetLowerFlow();
  openTab("loopSection");

  loadSystems();
}

/* ===============================
   LOAD PROJECT LIST (ALL PROJECTS)
================================ */
window.loadProjectList = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("ccd_projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return;

  const select = document.getElementById("projectSelect");
  if (!select) return;

  select.innerHTML = `<option value="">-- Select Project --</option>`;

  data.forEach(p => {
    select.innerHTML += `
      <option value="${p.id}">
        ${p.plant_name} – ${p.unit_name}
      </option>
    `;
  });
};

/* ===============================
   SWITCH PROJECT
================================ */
window.switchProject = async () => {
  const projectId = document.getElementById("projectSelect")?.value;
  if (!projectId) return;

  const { data, error } = await supabase
    .from("ccd_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !data) {
    alert("Project not found");
    return;
  }

  activateProject(data);
};

/* ===============================
   LOAD LAST PROJECT (OPTIONAL)
================================ */
window.addEventListener("DOMContentLoaded", async () => {
  loadProjectList();
});

/* ===============================
   LOAD CORROSION LOOPS
================================ */
window.loadSystems = async () => {
  if (!currentProjectId) return;

  const { data, error } = await supabase
    .from("corrosion_systems")
    .select("*")
    .eq("project_id", currentProjectId)
    .order("created_at");

  if (error) {
    alert(error.message);
    return;
  }

  const container = document.getElementById("systems");
  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = "<i>No loops added yet</i>";
    return;
  }

  data.forEach(loop => {
    container.innerHTML += `
      <div class="box">
        <b>${loop.system_name}</b><br>
        <small>${loop.process_description || ""}</small><br><br>
        <button onclick="openLoop('${loop.id}')">OPEN</button>
      </div>
    `;
  });
};

/* ===============================
   OPEN LOOP
================================ */
window.openLoop = (loopId) => {
  window.activeLoopId = loopId;
  window.activeCircuitId = null;

  openTab("circuitSection");

  hideSection("damageSection");
  hideSection("reportSection");

  if (window.loadCircuits) {
    window.loadCircuits(loopId);
  }
};

/* ===============================
   TAB NAVIGATION
================================ */
window.openTab = (sectionId) => {
  const sections = [
    "projectSection",
    "loopSection",
    "circuitSection",
    "damageSection",
    "reportSection"
  ];

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  document.getElementById(sectionId).style.display = "block";

  document.querySelectorAll(".tab").forEach(tab =>
    tab.classList.remove("active")
  );

  document
    .querySelector(`.tab[data-target="${sectionId}"]`)
    ?.classList.add("active");
};

/* ===============================
   UI HELPERS
================================ */
function lockProjectInputs() {
  plant.disabled = true;
  unit.disabled = true;
}

function resetLowerFlow() {
  window.activeLoopId = null;
  window.activeCircuitId = null;

  hideSection("loopSection");
  hideSection("circuitSection");
  hideSection("damageSection");
  hideSection("reportSection");
}

function hideSection(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}
