alert("project.js loaded");
import { supabase } from './supabase.js';

window.saveProject = async function () {
  const project = document.getElementById("project").value;
  const plant = document.getElementById("plant").value;

  const { data, error } = await supabase
    .from("projects")
    .insert([
      { project_name: project, plant_name: plant }
    ]);

  if (error) {
    alert("❌ ERROR: " + error.message);
    console.error("Supabase Error:", error);
  } else {
    alert("✅ Project Created Successfully");
    console.log("Inserted:", data);
  }
};
