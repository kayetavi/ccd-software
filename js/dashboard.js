import { supabase } from "./supabase.js";

/* Load projects */
async function loadProjects() {
  const { data } = await supabase
    .from("projects")
    .select("id, project_name");

  const sel = document.getElementById("project");
  sel.innerHTML = "<option value=''>Select Project</option>";

  data.forEach(p => {
    sel.innerHTML += `<option value="${p.id}">${p.project_name}</option>`;
  });
}

/* Temp band */
function tempBand(t) {
  if (t <= 120) return { band: "LOW", min: 0, max: 120 };
  if (t <= 260) return { band: "MEDIUM", min: 121, max: 260 };
  return { band: "HIGH", min: 261, max: 1000 };
}

/* Get or create loop */
async function getLoop(input) {
  const t = tempBand(input.temp);

  const { data } = await supabase
    .from("corrosion_loops")
    .select("*")
    .eq("project_id", input.project)
    .eq("fluid", input.fluid)
    .eq("phase", input.phase)
    .eq("temp_band", t.band)
    .limit(1);

  if (data.length) return data[0];

  const { data: loop } = await supabase
    .from("corrosion_loops")
    .insert({
      project_id: input.project,
      loop_name: `${input.unit} ${t.band} TEMP LOOP`,
      fluid: input.fluid,
      phase: input.phase,
      temp_min: t.min,
      temp_max: t.max,
      temp_band: t.band,
      sulfur: input.sulfur,
      chloride: input.chloride
    })
    .select()
    .single();

  return loop;
}

/* SAVE ALL */
window.saveAll = async () => {

  const input = {
    project: project.value,
    unit: unit.value,
    fluid: fluid.value,
    phase: phase.value,
    temp: Number(temp.value),
    sulfur: sulfur.checked,
    chloride: chloride.checked
  };

  const loop = await getLoop(input);

  const { data: circuit } = await supabase
    .from("circuits")
    .insert({
      loop_id: loop.id,
      circuit_name: equipment.value,
      material: material.value,
      temperature: input.temp,
      design_thickness: design_thk.value,
      minimum_thickness: min_thk.value
    })
    .select()
    .single();

  await supabase.rpc("auto_damage_for_circuit", { cid: circuit.id });
  await supabase.rpc("auto_inspection_for_circuit", { cid: circuit.id });

  alert("✅ Auto CCD Generated");
};

loadProjects();
