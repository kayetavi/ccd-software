import { supabase } from './supabase.js';

const projectId = localStorage.getItem("project_id");

const loadReport = async () => {
  const { data } = await supabase
    .from("corrosion_loops")
    .select(`
      loop_name,
      circuits (
        circuit_name,
        material,
        damage_mechanisms (
          mechanism_name,
          api_reference
        )
      )
    `)
    .eq("project_id", projectId);

  document.getElementById("report").innerText =
    JSON.stringify(data, null, 2);
};

loadReport();
