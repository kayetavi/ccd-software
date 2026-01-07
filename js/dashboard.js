import { supabase } from './supabase.js';

/* ===============================
   GLOBAL STATE
================================ */
export let currentProjectId = null;
window.activeLoopId = null;
window.activeCircuitId = null;
let currentUserRole = "viewer";

/* ===============================
   CREATE PROJECT (CREATOR = ADMIN)
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

  // ✅ 1️⃣ Create project (IMPORTANT: user_id)
  const { data: project, error } = await supabase
    .from("ccd_projects")
    .insert({
      plant_name: plant,
      unit_name: unit,
      user_id: user.id   // 🔥 THIS LINE FIXES EVERYTHING
    })
    .select()
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  // ✅ 2️⃣ Assign creator as ADMIN
  const { error: roleError } = await supabase
    .from("project_users")
    .insert({
      project_id: project.id,
      user_id: user.id,
      role: "admin"
    });

  if (roleError) {
    alert(roleError.message);
    return;
  }

  activateProject(project);
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
   LOAD USER ROLE (IMPORTANT)
================================ */
async function loadUserRole() {
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
   APPLY ROLE UI RULES
================================ */
function applyRoleUI() {
  const updateBtn = document.getElementById("updateProjectBtn");

  if (currentUserRole === "viewer") {
    lockProjectInputs();
    if (updateBtn) {
      updateBtn.disabled = true;
      updateBtn.title = "Viewer cannot update project";
    }
  } else {
    unlockProjectInputs();
    if (updateBtn) updateBtn.disabled = false;
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
   LOAD PROJECT LIST (USER BASED)
================================ */
window.loadProjectList = async () => {
  const admin = await isSuperAdmin();

  const { data } = admin
    ? await supabase.from("ccd_projects").select("*")
    : await supabase
        .from("project_users")
        .select(`
          project_id,
          ccd_projects ( plant_name, unit_name )
        `);

  const select = document.getElementById("projectSelect");
  select.innerHTML = `<option value="">-- Select Project --</option>`;

  data.forEach(p => {
    const project = admin ? p : p.ccd_projects;
    const id = admin ? p.id : p.project_id;

    select.innerHTML += `
      <option value="${id}">
        ${project.plant_name} – ${project.unit_name}
      </option>
    `;
  });
};


/* ===============================
   SWITCH PROJECT
================================ */
window.switchProject = async () => {
  const projectId = document.getElementById("projectSelect").value;
  if (!projectId) return;

  const { data } = await supabase
    .from("ccd_projects")
    .select("*")
    .eq("id", projectId)
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
