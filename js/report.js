import { supabase } from "./supabase.js";

const { data } = await supabase
  .from("circuits")
  .select(`
    circuit_name,
    material,
    temperature,
    corrosion_loops(loop_name),
    circuit_damage_mechanisms(damage_mechanism, api_reference)
  `);

document.getElementById("report").innerHTML =
  JSON.stringify(data, null, 2);
