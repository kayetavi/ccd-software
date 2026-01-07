import { supabase } from './supabase.js';

/* ===============================
   GLOBAL STATE
================================ */
export let currentProjectId = null;
window.activeLoopId = null;
window.activeCircuitId = null;
let currentUserRole = "viewer";

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
  if (!user) {
    alert("User not logged in");
    return;
  }

  const { data, error } = await supabase
    .from("ccd_projects")
    .insert({
      plant_name: plant,
      unit_name: unit,
      user_id: user.id,
      role: "admin" // creator = admin
    })
    .select()
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  activateProject(data);
  loadProjectList();
};

/* ===============================
   ACTIVATE PROJECT
================================ */
async function activateProject(project) {
  currentProjectId = project.id;

  document.getElementById("plant").value = project.plant_name;
  document.getElementById("unit").value = project.unit_name;

  document.getElementById("projectStatus").innerText =
    `Project Active: ${project.plant_name} – ${project.unit_name}`;

  await loadUserRole();
  applyRoleUI();

  resetLowerFlow();
  openTab("loopSection");
  loadSystems();
}

/* ===============================
   LOAD USER ROLE
================================ */
async function loadUserRole() {
  if (!currentProjectId) return;

  const { data, error } = await supabase
    .from("ccd_projects")
    .select("role")
    .eq("id", currentProjectId)
    .single();

  currentUserRole = data?.role || "viewer";
}

/* ===============================
   APPLY ROLE UI RULES
================================ */
function applyRoleUI() {
  const updateBtn = document.querySelector("button[onclick='updateProject()']");

  if (currentUserRole === "viewer") {
    updateBtn.disabled = true;
    updateBtn.title = "Viewer cannot update project";
    lockProjectInputs();
  } else {
    updateBtn.disabled = false;
    unlockProjectInputs();
  }
}

/* ===============================
   LOAD PROJECT LIST
================================ */
window.loadProjectList = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("ccd_projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">-- Select Project --</option>`;

  data.forEach(p => {
    select.innerHTML += `
      <option value="${p.id}">
        ${p.plant_name} – ${p.unit_name}
      </option>`;
  });
};

/* ===============================
   SWITCH PROJECT
================================ */
window.switchProject = async () => {
  const projectId = document.getElementById("projectSelect").value;
  if (!projectId) return;

  const { data, error } = await supabase
    .from("ccd_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    alert("Project not found");
    return;
  }

  activateProject(data);
};

/* ===============================
   UPDATE PROJECT (ADMIN / EDITOR)
================================ */
window.updateProject = async () => {
  if (!currentProjectId) {
    alert("No active project");
    return;
  }

  if (currentUserRole === "viewer") {
    alert("❌ You don't have permission");
    return;
  }

  const plant = document.getElementById("plant").value.trim();
  const unit = document.getElementById("unit").value.trim();

  const { error } = await supabase
    .from("ccd_projects")
    .update({
      plant_name: plant,
      unit_name: unit
    })
    .eq("id", currentProjectId);

  if (error) {
    alert(error.message);
    return;
  }

  document.getElementById("projectStatus").innerText =
    `Project Active: ${plant} – ${unit}`;

  alert("✅ Project updated");
};

/* ===============================
   LOAD CORROSION LOOPS
================================ */
window.loadSystems = async () => {
  if (!currentProjectId) return;

  const { data } = await supabase
    .from("corrosion_systems")
    .select("*")
    .eq("project_id", currentProjectId);

  const container = document.getElementById("systems");
  container.innerHTML = data.length
    ? data.map(loop => `
        <div class="box">
          <b>${loop.system_name}</b><br>
          <small>${loop.process_description || ""}</small><br><br>
          <button onclick="openLoop('${loop.id}')">OPEN</button>
        </div>`).join("")
    : "<i>No loops added yet</i>";
};

/* ===============================
   OPEN LOOP
================================ */
window.openLoop = (loopId) => {
  window.activeLoopId = loopId;
  window.activeCircuitId = null;
  openTab("circuitSection");
  if (window.loadCircuits) window.loadCircuits(loopId);
};

/* ===============================
   TAB CONTROL
================================ */
window.openTab = (id) => {
  document.querySelectorAll("section.box")
    .forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.tab[data-target="${id}"]`)?.classList.add("active");
};

/* ===============================
   HELPERS
================================ */
function lockProjectInputs() {
  plant.disabled = true;
  unit.disabled = true;
}

function unlockProjectInputs() {
  plant.disabled = false;
  unit.disabled = false;
}

function resetLowerFlow() {
  hide("loopSection");
  hide("circuitSection");
  hide("damageSection");
  hide("reportSection");
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}

/* ===============================
   INIT
================================ */
window.addEventListener("DOMContentLoaded", loadProjectList);
