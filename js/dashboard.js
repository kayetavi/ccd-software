import { supabase } from './supabase.js';

/* ===============================
   PROJECT CONTEXT (PERSISTENT)
================================ */
export let currentProjectId = localStorage.getItem("active_project");

/* ===============================
   CREATE PROJECT
================================ */
window.createProject = async () => {
  const plantInput = document.getElementById("plant");
  const unitInput = document.getElementById("unit");

  if (!plantInput || !unitInput) {
    alert("Project inputs missing in HTML");
    return;
  }

  const plant = plantInput.value.trim();
  const unit = unitInput.value.trim();

  if (!plant || !unit) {
    alert("Plant and Unit are required");
    return;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("User not authenticated");
    return;
  }

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
    alert("Project create failed: " + error.message);
    return;
  }

  currentProjectId = data.id;
  localStorage.setItem("active_project", data.id);

  const status = document.getElementById("projectStatus");
  if (status) {
    status.innerText = `Project Active: ${plant} – ${unit}`;
  }

  lockProjectInputs();
  openTab("loopSection");

  loadSystems();
};

/* ===============================
   LOAD PROJECT ON PAGE REFRESH
================================ */
window.addEventListener("DOMContentLoaded", async () => {
  if (!currentProjectId) return;

  const { data, error } = await supabase
    .from('ccd_projects')
    .select('*')
    .eq('id', currentProjectId)
    .single();

  if (error || !data) {
    localStorage.removeItem("active_project");
    return;
  }

  const plantInput = document.getElementById("plant");
  const unitInput = document.getElementById("unit");

  if (plantInput) plantInput.value = data.plant_name;
  if (unitInput) unitInput.value = data.unit_name;

  const status = document.getElementById("projectStatus");
  if (status) {
    status.innerText = `Project Active: ${data.plant_name} – ${data.unit_name}`;
  }

  lockProjectInputs();
  openTab("loopSection");

  loadSystems();
});

/* ===============================
   LOCK PROJECT INPUTS
================================ */
function lockProjectInputs() {
  const plant = document.getElementById("plant");
  const unit = document.getElementById("unit");

  if (plant) plant.disabled = true;
  if (unit) unit.disabled = true;
}

/* ===============================
   LOAD CORROSION LOOPS (SYSTEMS)
================================ */
window.loadSystems = async () => {
  if (!currentProjectId) return;

  const { data, error } = await supabase
    .from('corrosion_systems')
    .select('*')
    .eq('project_id', currentProjectId)
    .order('created_at', { ascending: true });

  if (error) {
    alert("Failed to load loops: " + error.message);
    return;
  }

  const container = document.getElementById("systems");
  if (!container) return;

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
   OPEN LOOP (SINGLE DASHBOARD FLOW)
================================ */
window.openLoop = (loopId) => {
  if (!loopId) return;

  localStorage.setItem("active_loop", loopId);
  localStorage.removeItem("active_circuit");

  showSection("circuitSection");

  // 🔥 hide report until ready
  const report = document.getElementById("reportSection");
  if (report) report.style.display = "none";

  if (window.loadCircuits) {
    window.loadCircuits();
  }
};


/* ===============================
   HELPER: SHOW SECTION SAFELY
================================ */
function showSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) el.style.display = "block";
}


window.showReportSection = () => {
  const report = document.getElementById("reportSection");
  if (report) {
    report.style.display = "block";
  }
};

/* ===============================
   TAB NAVIGATION (AUTO + MANUAL)
================================ */
window.openTab = (sectionId, btn = null) => {

  const sections = [
    "projectSection",
    "loopSection",
    "circuitSection",
    "damageSection",
    "reportSection"
  ];

  /* hide all sections */
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  /* show active section */
  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.style.display = "block";
    activeSection.scrollIntoView({ behavior: "smooth" });
  }

  /* reset tab highlight */
  document.querySelectorAll(".tab").forEach(tab =>
    tab.classList.remove("active")
  );

  /* highlight correct tab */
  if (btn) {
    btn.classList.add("active");
  } else {
    // 🔥 auto-detect tab using sectionId
    const autoTab = document.querySelector(
      `.tab[data-target="${sectionId}"]`
    );
    if (autoTab) autoTab.classList.add("active");
  }
};
