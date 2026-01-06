import { supabase } from "./supabase.js";

/* LOAD CIRCUITS */
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

/* LOAD DAMAGE */
async function loadDamage(cid) {
  const { data, error } = await supabase
    .from("circuit_damage_mechanisms")
    .select("*")
    .eq("circuit_id", cid);

  if (error) {
    console.error(error);
    return;
  }

  const tbody = document.getElementById("damageTable");
  tbody.innerHTML = "";

  data.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td>${d.damage_mechanism}</td>
        <td>${d.likelihood}</td>
        <td>${d.inspection_focus}</td>
        <td>${d.api_reference}</td>
      </tr>
    `;
  });
}

document.getElementById("circuitSelect")
  .addEventListener("change", e => {
    if (e.target.value) loadDamage(e.target.value);
  });

loadCircuits();
