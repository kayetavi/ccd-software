import { supabase } from "./supabase.js";

/* ---------------- LOAD PROJECT LIST ---------------- */
async function loadProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("id, project_name");

  if (error) {
    alert("Project load error");
    return;
  }

  const sel = document.getElementById("project");
  sel.innerHTML = `<option value="">-- Select Project --</option>`;

  data.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id;
    o.text = p.project_name;
    sel.appendChild(o);
  });
}

/* ---------------- TEMP BAND LOGIC ---------------- */
function getTempBand(temp) {
  if (temp > 260) return "HIGH";
  if (temp >= 120) return "MEDIUM";
  return "LOW";
}

/* ---------------- AUTO LOOP ---------------- */
async function getOrCreateLoop(input) {

  const tempBand = getTempBand(input.temperature);

  const { data: existingLoops, error } = await supabase
    .from("corrosion_loops")
    .select("*")
    .eq("project_id", input.project_id)
    .eq("fluid", input.fluid)
    .eq("phase", input.phase)
    .eq("sulfur", input.sulfur)
    .eq("chloride", input.chloride)
    .eq("temp_band", tempBand);

  if (error) {
    alert("Loop search error");
    throw error;
  }

  if (existingLoops.length > 0) {
    return existingLoops[0]; // reuse loop
  }

  // CREATE NEW LOOP
  const loopName = `${input.unit} ${tempBand} TEMP LOOP`;

  const { data: newLoop, error: insertError } = await supabase
    .from("corrosion_loops")
    .insert([{
      project_id: input.project_id,
      loop_name: loopName,
      fluid: input.fluid,
      phase: input.phase,
      temp_band: tempBand,
      sulfur: input.sulfur,
      chloride: input.chloride
    }])
    .select()
    .single();

  if (insertError) {
    alert("Loop create failed");
    throw insertError;
  }

  return newLoop;
}

/* ---------------- SAVE ALL (MAIN) ---------------- */
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

  // AUTO LOOP
  const loop = await getOrCreateLoop(loopInput);

  // AUTO CIRCUIT
  const circuitData = {
    loop_id: loop.id,
    circuit_name: circuit_name.value,
    material: material.value,
    temperature,
    sulfur: sulfur.checked,
    chloride: chloride.checked,
    design_thickness: Number(design_thk.value),
    minimum_thickness: Number(min_thk.value)
  };

  const { error: circuitError } = await supabase
    .from("circuits")
    .insert([circuitData]);

  if (circuitError) {
    alert("Circuit save error");
    return;
  }

  alert("✅ Loop reused/created + Circuit added successfully");
};

loadProjects();
