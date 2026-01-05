import { supabase } from './supabase.js';

window.saveProject = async function () {
  const project = document.getElementById("project").value;
  const plant = document.getElementById("plant").value;

  await supabase.from("projects").insert([
    { project_name: project, plant_name: plant }
  ]);

  alert("Project Created");
};
