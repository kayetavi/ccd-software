import { supabase } from './supabase.js';

const projectSelect = document.getElementById("projectSelect");

async function loadProjects() {
  const { data } = await supabase
    .from("projects")
    .select("*");

  projectSelect.innerHTML = `<option value="">Select Project</option>`;
  data.forEach(p => {
    projectSelect.innerHTML +=
      `<option value="${p.id}">${p.project_name}</option>`;
  });
}

window.saveProject = async function () {
  const project = document.getElementById("project").value;
  const plant = document.getElementById("plant").value;

  await supabase.from("projects").insert([
    { project_name: project, plant_name: plant }
  ]);

  alert("✅ Project Saved");
  loadProjects();
};

window.selectProject = function () {
  localStorage.setItem("project_id", projectSelect.value);
  alert("Project Selected");
};

loadProjects();
