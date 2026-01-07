import { supabase } from './supabase.js';
import { currentProjectId } from './dashboard.js';

/* ===============================
   GENERATE CCD REPORT
================================ */
window.generateReport = async () => {

  const reportSection = document.getElementById("reportSection");
  const reportDiv = document.getElementById("reportContent");

  reportSection.style.display = "block";
  reportDiv.innerHTML = "<i>Generating CCD report...</i>";

  /* ===============================
     ACTIVE PROJECT (IN-MEMORY)
  ================================ */
  if (!currentProjectId) {
    reportDiv.innerHTML = "❌ No active project selected";
    return;
  }

  /* ===============================
     FETCH PROJECT
  ================================ */
  const { data: project, error: pErr } = await supabase
    .from("ccd_projects")
    .select("*")
    .eq("id", currentProjectId)
    .single();

  if (pErr || !project) {
    reportDiv.innerHTML = "❌ Project not found";
    return;
  }

  /* ===============================
     FETCH FULL STRUCTURE
     PROJECT → LOOPS → CIRCUITS → DAMAGE
  ================================ */
  const { data: loops, error: lErr } = await supabase
    .from("corrosion_systems")
    .select(`
      id,
      system_name,
      process_description,
      circuits (
        id,
        circuit_name,
        material,
        operating_temp,
        operating_pressure,
        circuit_damage_map (
          damage_mechanisms_master (
            name,
            api_reference
          )
        )
      )
    `)
    .eq("project_id", project.id)
    .order("created_at");

  if (lErr || !loops || loops.length === 0) {
    reportDiv.innerHTML = "❌ No corrosion loops found";
    return;
  }

  /* ===============================
     BUILD REPORT HTML
  ================================ */
  let html = `
    <h3>📄 Corrosion Control Document (CCD)</h3>
    <p>
      <b>Plant:</b> ${project.plant_name}<br>
      <b>Unit:</b> ${project.unit_name}
    </p>
    <hr>
  `;

  loops.forEach((loop, i) => {

    html += `
      <h4>${i + 1}. Corrosion Loop: ${loop.system_name}</h4>
      <p>${loop.process_description || ""}</p>
    `;

    if (!loop.circuits || loop.circuits.length === 0) {
      html += `<i>No circuits defined</i><hr>`;
      return;
    }

    loop.circuits.forEach((circuit, j) => {

      html += `
        <div style="margin-left:20px;margin-bottom:10px">
          <b>${i + 1}.${j + 1} Circuit:</b> ${circuit.circuit_name}<br>
          Material: ${circuit.material}<br>
          Operating Temp: ${circuit.operating_temp ?? "-"} °C<br>
          Operating Pressure: ${circuit.operating_pressure ?? "-"} bar<br>

          <u>Damage Mechanisms:</u>
          <ul>
      `;

      if (
        !circuit.circuit_damage_map ||
        circuit.circuit_damage_map.length === 0
      ) {
        html += `<li>None selected</li>`;
      } else {
        circuit.circuit_damage_map.forEach(dm => {
          html += `
            <li>
              ${dm.damage_mechanisms_master.name}
              (${dm.damage_mechanisms_master.api_reference || "API 571"})
            </li>
          `;
        });
      }

      html += `
          </ul>
        </div>
      `;
    });

    html += `<hr>`;
  });

  reportDiv.innerHTML = html;
};
