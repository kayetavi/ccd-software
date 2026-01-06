import { supabase } from "./supabase.js";

async function loadCCD() {
  const { data, error } = await supabase
    .from("ccd_view")
    .select("*");

  if (error) {
    console.error(error);
    alert("Error loading CCD data");
    return;
  }

  if (!data || data.length === 0) {
    alert("No CCD data found");
    return;
  }

  // Header info (assuming single project/loop)
  document.getElementById("project").innerText =
    "Project: " + data[0].project_name;

  document.getElementById("loop").innerText =
    "Corrosion Loop: " + data[0].loop_name;

  const table = document.getElementById("damageTable");

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.circuit_name}</td>
      <td>${row.mechanism_name}</td>
      <td>${row.damage_api}</td>
      <td>${row.inspection_method}</td>
      <td>${row.inspection_interval_years}</td>
    `;
    table.appendChild(tr);
  });

  // Remaining life (take first row – same circuit)
  const rl = data[0].remaining_life_years;

  document.getElementById("life").innerText =
    `Remaining Life: ${rl} years`;

  // Engineering recommendation (INDUSTRY RULE)
  let recommendation = "";
  if (rl > 10) {
    recommendation = "Normal inspection as per API 970.";
  } else if (rl >= 5 && rl <= 10) {
    recommendation = "Increase inspection frequency and monitor corrosion rate.";
  } else {
    recommendation = "Plan repair / replacement. Immediate action required.";
  }

  document.getElementById("recommendation").innerText = recommendation;
}

loadCCD();
