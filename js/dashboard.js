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
  const plant = plantInput().value.trim();
  const unit = unitInput().value.trim();

  if (!plant || !unit) {
    alert("Plant and Unit are required");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("User not logged in");
    return;
  }

  // 1️⃣ Create project
  const { data: project, error } = await supabase
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

  // 2️⃣ Assign creator as ADMIN
  await supabase.from("project_users").insert({
    project_id: project.id,
    user_id: user.id,
    email: user.email,
    role: "admin"
  });

  activateProject(project);
  loadProjectList();
};

/* ===============================
   ACTIVATE PROJECT
================================ */
async function activateProject(project) {
  currentProjectId = project.id;

  plantInput().value = project.plant_name;
  unitInput().value = project.unit_name;

  projectStatus().innerText =
    `Project Active: ${project.plant_name} – ${project.unit_name}`;

  await loadUserRole();
  applyRoleUI();

  resetLowerFlow();
  openTab("loopSection");
  loadSystems();
}

/* ===============================
   LOAD USER ROLE (CORE LOGIC)
================================ */
async function loadUserRole() {
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("project_users")
    .select("role")
    .eq("project_id", currentProjectId)
    .eq("email", user.email)
    .single();

  currentUserRole = data?.role || "viewer";
}

/* ===============================
   APPLY ROLE RULES (UI)
================================ */
function applyRoleUI() {
  const updateBtn = document.getElementById("updateProjectBtn");

  if (currentUserRole === "viewer") {
    updateBtn.disabled = true;
    lockProjectInputs();
  } else {
    updateBtn.disabled = false;
    unlockProjectInputs();
  }
}

/* ===============================
   UPDATE PROJECT (ADMIN / EDITOR)
================================ */
window.updateProject = async () => {
  if (currentUserRole === "viewer") {
    alert("❌ Viewer cannot update project");
    return;
  }

  const plant = plantInput().value.trim();
  const unit = unitInput().value.trim();

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

  projectStatus().innerText =
    `Project Active: ${plant} – ${unit}`;

  alert("✅ Project updated");
};

/* ===============================
   LOAD PROJECT LIST (ROLE BASED)
================================ */
window.loadProjectList = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("project_users")
    .select(`
      project_id,
      ccd_projects ( plant_name, unit_name )
    `)
    .eq("email", user.email);

  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">-- Select Project --</option>`;

  data.forEach(p => {
    select.innerHTML += `
      <option value="${p.project_id}">
        ${p.ccd_projects.plant_name} – ${p.ccd_projects.unit_name}
      </option>`;
  });
};

/* ===============================
   SWITCH PROJECT
================================ */
window.switchProject = async () => {
  const id = document.getElementById("projectSelect").value;
  if (!id) return;

  const { data } = await supabase
    .from("ccd_projects")
    .select("*")
    .eq("id", id)
    .single();

  activateProject(data);
};

/* ===============================
   HELPERS
================================ */
function plantInput() {
  return document.getElementById("plant");
}
function unitInput() {
  return document.getElementById("unit");
}
function projectStatus() {
  return document.getElementById("projectStatus");
}

function lockProjectInputs() {
  plantInput().disabled = true;
  unitInput().disabled = true;
}

function unlockProjectInputs() {
  plantInput().disabled = false;
  unitInput().disabled = false;
}

function resetLowerFlow() {
  ["loopSection", "circuitSection", "damageSection", "reportSection"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
}

/* ===============================
   INIT
================================ */
window.addEventListener("DOMContentLoaded", loadProjectList);
