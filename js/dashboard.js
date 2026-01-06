import { supabase } from "./supabase.js";

async function loadProjects() {
  const { data } = await supabase.from("projects").select("id, project_name");
  const sel = document.getElementById("project");
  data.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.text = p.project_name;
    sel.appendChild(o);
  });
}

window.saveAll = async function () {
  const project_id = document.getElementById("project").value;

  // LOOP AUTO CREATE
  const loopData = {
    project_id,
    loop_name: loop_name.value,
    fluid: fluid.value,
    temp_min: temperature.value,
    temp_max: temperature.value,
    sulfur: sulfur.checked,
    chloride: chloride.checked
  };

  const { data: loop } = await supabase
    .from("corrosion_loops")
    .insert(loopData)
    .select()
    .single();

  // CIRCUIT AUTO CREATE
  const circuitData = {
    loop_id: loop.id,
    circuit_name: circuit_name.value,
    material: material.value,
    temperature: temperature.value,
    sulfur: sulfur.checked,
    chloride: chloride.checked,
    design_thickness: design_thk.value,
    minimum_thickness: min_thk.value
  };

  await supabase.from("circuits").insert(circuitData);

  alert("Loop, Circuit & Auto Damage Generated");
};

loadProjects();
