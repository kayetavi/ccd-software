import { supabase } from "./supabase.js";

/* LOAD PROJECTS */
async function loadProjects() {
  const { data } = await supabase
    .from("projects")
    .select("id, project_name");

  const sel = document.getElementById("project");
  sel.innerHTML = `<option value="">-- Select Project --</option>`;

  data.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.text = p.project_name;
    sel.appendChild(o);
  });
}

/* TEMP BAND */
function getTempBand(temp) {
  if (temp > 260) return "HIGH";
  if (temp >= 120) return "MEDIUM";
  return "LOW";
}

/* AUTO LOOP */
async function getOrCreateLoop(input) {

  const tempBand = getTempBand(input.temperature);

  const { data: loops } = await supabase
    .from("corrosion_loops")
    .select("*")
    .eq("project_id", input.project_id)
    .eq("fluid", input.fluid)
    .eq("phase", input.phase)
    .eq("sulfur", input.sulfur)
    .eq("chloride", input.chloride)
    .eq("temp_band", tempBand);

  if (loops.length > 0) return loops[0];

  const { data: loop } = await supabase
    .from("corrosion_loops")
    .insert([{
      project_id: input.project_id,
      loop_name: `${input.unit} ${tempBand} TEMP LOOP`,
      fluid: input.fluid,
      phase: input.phase,
      temp_band: tempBand,
      sulfur: input.sulfur,
      chloride: input.chloride
    }])
    .select()
    .single();

  return loop;
}

/* SAVE ALL */
window.saveAll = async function () {

  const project_id = project.value;
  if (!project_id) {
    alert("Select project");
    return;
  }

  const temperature = Number(temp.value);

  const loopInput = {
    project_id,
    unit: unit.value,
    fluid: fluid.value,
    phase: phase.value,
    temperature,
    sulfur: sulfur.checked,
    chloride: chloride.checked
  };

  const loop = await getOrCreateLoop(loopInput);

  await supabase.from("circuits").insert([{
    loop_id: loop.id,
    circuit_name: equipment.value,
    material: material.value,
    temperature,
    sulfur: sulfur.checked,
    chloride: chloride.checked,
    design_thickness: Number(design_thk.value),
    minimum_thickness: Number(min_thk.value)
  }]);

  alert("✅ Loop & Circuit created automatically");
};

loadProjects();
