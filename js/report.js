import { supabase } from "./supabase.js";

const { data, error } = await supabase
  .from("ccd_view")   // we will create this view
  .select("*");

if (error) {
  alert(error.message);
  console.error(error);
}

document.getElementById("project").innerText =
  `${data[0].project_name}`;

document.getElementById("loop").innerText =
  data[0].loop_name;

data.forEach(row => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${row.circuit_name}</td>
    <td>${row.mechanism_name}</td>
    <td>${row.damage_api}</td>
    <td>${row.inspection_method}</td>
    <td>${row.inspection_interval_years}</td>
  `;
  damageTable.appendChild(tr);
});

document.getElementById("life").innerText =
  `Remaining Life: ${row.remaining_life_years} years`;
