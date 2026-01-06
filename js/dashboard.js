import { supabase } from './supabase.js';

/* ===============================
   PROJECT CONTEXT (IN-MEMORY)
================================ */
export let currentProjectId = null;

/* ===============================
   CREATE PROJECT
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

  currentProjectId = data.id;

  document.getElementById("projectStatus").innerText =
    `Project Active: ${data.plant_name} – ${data.unit_name}`;

  lockProjectInputs();
  openTab("loopSection");

  loadSystems();
};

/* ===============================
   LOAD LATEST PROJECT ON LOGIN
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

  currentProjectId = project.id;

  document.getElementById("plant").value = project.plant_name;
  document.getElementById("unit").value = project.unit_name;
  document.getElementById("projectStatus").innerText =
    `Project Active: ${project.plant_name} – ${project.unit_name}`;

  lockProjectInputs();
  openTab("loopSection");

  loadSystems();
});

/* ===============================
   LOAD LOOPS
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
   OPEN LOOP (NO localStorage)
================================ */
window.openLoop = (loopId) => {
  if (!loopId) return;

  window.activeLoopId = loopId; // in-memory only

  openTab("circuitSection");

  if (window.loadCircuits) {
    window.loadCircuits(loopId);
  }
};

/* ===============================
   UI HELPERS
================================ */
function lockProjectInputs() {
  document.getElementById("plant").disabled = true;
  document.getElementById("unit").disabled = true;
}

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
