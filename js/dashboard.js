import { supabase } from './supabase.js';

/* ===============================
   SUPER ADMIN CHECK
================================ */
async function isSuperAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("global_role")
    .eq("id", user.id)
    .single();

  return data?.global_role === "super_admin";
}

/* ===============================
   GLOBAL STATE (FIXED)
================================ */
// 🔥 restore project after refresh
export let currentProjectId =
  localStorage.getItem("activeProjectId");

window.activeLoopId = null;
window.activeCircuitId = null;

let currentUserRole = "viewer";
let isGlobalAdmin = false;

/* ===============================
   CREATE PROJECT
================================ */
window.createProject = async () => {

  const plant = document.getElementById("plant").value.trim();
  const unit = document.getElementById("unit").value.trim();

  if (!plant || !unit) {
    alert("Plant and Unit required");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return alert("Not logged in");

  const { data: project, error } = await supabase
    .from("ccd_projects")
    .insert({
      plant_name: plant,
      unit_name: unit,
      user_id: user.id
    })
    .select()
    .single();

  if (error) return alert(error.message);

  await supabase.from("project_users").insert({
    project_id: project.id,
    user_id: user.id,
    role: "admin"
  });

  await loadProjectList();
  activateProject(project);
};

/* ===============================
   ACTIVATE PROJECT (FIXED)
================================ */
async function activateProject(project) {

  // 🔥 MOST IMPORTANT FIX
  currentProjectId = project.id;
  localStorage.setItem("activeProjectId", project.id);

  plant.value = project.plant_name;
  unit.value = project.unit_name;

  projectStatus.innerText =
    `Active Project: ${project.plant_name} – ${project.unit_name}`;

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

  isGlobalAdmin = await isSuperAdmin();
  if (isGlobalAdmin) {
    currentUserRole = "admin";
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !currentProjectId) return;

  const { data } = await supabase
    .from("project_users")
    .select("role")
    .eq("project_id", currentProjectId)
    .eq("user_id", user.id)
    .single();

  currentUserRole = data?.role || "viewer";
}

/* ===============================
   APPLY ROLE UI
================================ */
function applyRoleUI() {
  if (isGlobalAdmin || currentUserRole !== "viewer") {
    unlockProjectInputs();
  } else {
    lockProjectInputs();
  }
}

/* ===============================
   UPDATE PROJECT
================================ */
window.updateProject = async () => {

  if (!isGlobalAdmin && currentUserRole === "viewer") {
    alert("Viewer cannot update project");
    return;
  }

  const { error } = await supabase
    .from("ccd_projects")
    .update({
      plant_name: plant.value.trim(),
      unit_name: unit.value.trim()
    })
    .eq("id", currentProjectId);

  if (error) return alert(error.message);
  alert("✅ Project updated");
};

/* ===============================
   LOAD PROJECT LIST
================================ */
window.loadProjectList = async () => {

  isGlobalAdmin = await isSuperAdmin();
  let data = [];

  if (isGlobalAdmin) {
    const res = await supabase.from("ccd_projects").select("*");
    data = res.data || [];
  } else {
    const res = await supabase
      .from("project_users")
      .select(`project_id, ccd_projects ( plant_name, unit_name )`);
    data = res.data || [];
  }

  projectSelect.innerHTML =
    `<option value="">-- Select Project --</option>`;

  data.forEach(p => {
    const id = isGlobalAdmin ? p.id : p.project_id;
    const proj = isGlobalAdmin ? p : p.ccd_projects;

    projectSelect.innerHTML += `
      <option value="${id}">
        ${proj.plant_name} – ${proj.unit_name}
      </option>`;
  });

  // 🔥 auto-select last project
  if (currentProjectId) {
    projectSelect.value = currentProjectId;
    const found = data.find(p =>
      (isGlobalAdmin ? p.id : p.project_id) === currentProjectId
    );
    if (found) {
      activateProject(isGlobalAdmin ? found : found.ccd_projects);
    }
  }
};

/* ===============================
   SWITCH PROJECT
================================ */
window.switchProject = async () => {

  if (!projectSelect.value) return;

  const { data } = await supabase
    .from("ccd_projects")
    .select("*")
    .eq("id", projectSelect.value)
    .single();

  activateProject(data);
};

/* ===============================
   LOAD LOOPS
================================ */
window.loadSystems = async () => {

  if (!currentProjectId) return;

  const { data } = await supabase
    .from("corrosion_systems")
    .select("*")
    .eq("project_id", currentProjectId);

  systems.innerHTML = data?.length
    ? data.map(l => `
      <div class="box">
        <b>${l.system_name}</b><br>
        <small>${l.process_description || ""}</small><br>
        <button onclick="openLoop('${l.id}')">OPEN</button>
      </div>`).join("")
    : "<i>No loops added</i>";
};

/* ===============================
   OPEN LOOP
================================ */
window.openLoop = (id) => {
  window.activeLoopId = id;
  openTab("circuitSection");
  window.loadCircuits?.(id);
};

/* ===============================
   TAB CONTROL
================================ */
window.openTab = (id) => {
  document.querySelectorAll("section.box")
    .forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
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
  ["loopSection","circuitSection","damageSection","reportSection"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
}

/* ===============================
   INIT
================================ */
window.addEventListener("DOMContentLoaded", loadProjectList);
