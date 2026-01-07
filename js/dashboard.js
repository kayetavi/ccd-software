import { supabase } from './supabase.js';

/* ===============================
   GLOBAL STATE (IN-MEMORY ONLY)
================================ */
export let currentProjectId = null;
window.activeLoopId = null;
window.activeCircuitId = null;

/* ===============================
   CREATE PROJECT
================================ */
window.createProject = async () => {
  const plantEl = document.getElementById("plant");
  const unitEl = document.getElementById("unit");

  const plant = plantEl?.value.trim();
  const unit = unitEl?.value.trim();

  if (!plant || !unit) {
    alert("Plant and Unit are required");
    return;
  }

  const { data: { user }, error: userError } =
    await supabase.auth.getUser();

  if (userError || !user) {
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
    alert("Project create failed: " + error.message);
    return;
  }

  activateProject(data);
};

/* ===============================
   ACTIVATE PROJECT (CORE LOGIC)
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
   LOAD LAST PROJECT ON LOGIN
================================ */
window.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: project } = await supabase
    .from("ccd_projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!project) return;

  activateProject(project);
});

/* ===============================
   RESET PROJECT (NEW PROJECT FLOW)
================================ */
window.resetProject = () => {
  currentProjectId = null;
  window.activeLoopId = null;
  window.activeCircuitId = null;

  document.getElementById("plant").value = "";
  document.getElementById("unit").value = "";
  document.getElementById("projectStatus").innerText = "";

  unlockProjectInputs();
  clearAllSections();

  openTab("projectSection");
};

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

  if (!data || data.length === 0) {
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
  if (!loopId) return;

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

  const active = document.getElementById(sectionId);
  if (active) active.style.display = "block";

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
  document.getElementById("plant").disabled = true;
  document.getElementById("unit").disabled = true;
}

function unlockProjectInputs() {
  document.getElementById("plant").disabled = false;
  document.getElementById("unit").disabled = false;
}

function clearAllSections() {
  hideSection("loopSection");
  hideSection("circuitSection");
  hideSection("damageSection");
  hideSection("reportSection");

  document.getElementById("systems").innerHTML = "";
  document.getElementById("circuits").innerHTML = "";
  document.getElementById("damageList").innerHTML = "";
  document.getElementById("reportContent").innerHTML = "";
}

function resetLowerFlow() {
  window.activeLoopId = null;
  window.activeCircuitId = null;
  clearAllSections();
}

function hideSection(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}
