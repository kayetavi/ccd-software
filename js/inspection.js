import { supabase } from "./supabase.js";

async function loadCircuits() {
  const { data } = await supabase
    .from("circuits")
    .select("id, circuit_name");

  const sel = document.getElementById("circuitSelect");
  sel.innerHTML = `<option value="">Select Circuit</option>`;

  data.forEach(c => {
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = c.circuit_name;
    sel.appendChild(o);
  });
}

async function loadInspection(cid) {
  const { data } = await supabase
    .from("circuit_inspection_plan")
    .select("*")
    .eq("circuit_id", cid);

  const tbody = document.getElementById("inspectionTable");
  tbody.innerHTML = "";

  data.forEach(i => {
    tbody.innerHTML += `
      <tr>
        <td>${i.damage_mechanism}</td>
        <td>${i.inspection_method}</td>
        <td>${i.interval_years}</td>
        <td>${i.inspection_focus}</td>
        <td>${i.api_reference}</td>
      </tr>
    `;
  });
}

document.getElementById("circuitSelect")
  .addEventListener("change", e => {
    if (e.target.value) loadInspection(e.target.value);
  });

loadCircuits();
