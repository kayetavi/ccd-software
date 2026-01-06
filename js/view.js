import { supabase } from "./supabase.js";

async function loadData() {
  const { data } = await supabase
    .from("circuits")
    .select(`
      circuit_name,
      material,
      temperature,
      corrosion_loops(loop_name)
    `)
    .order("id", { ascending: false });

  const div = document.getElementById("data");
  div.innerHTML = "";

  data.forEach(d => {
    div.innerHTML += `
      <p>
        <b>${d.circuit_name}</b><br>
        Loop: ${d.corrosion_loops.loop_name}<br>
        Temp: ${d.temperature}°C
      </p><hr>
    `;
  });
}

loadData();
