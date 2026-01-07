import { supabase } from './supabase.js';
import { currentProjectId } from './dashboard.js';

/* ===============================
   GENERATE CCD REPORT (NERAL STYLE)
================================ */
window.generateReport = async () => {

  const reportSection = document.getElementById("reportSection");
  const reportDiv = document.getElementById("reportContent");

  reportSection.style.display = "block";
  reportDiv.innerHTML = "<i>Generating CCD report...</i>";

  if (!currentProjectId) {
    reportDiv.innerHTML = "❌ No active project selected";
    return;
  }

  /* ===============================
     FETCH PROJECT
  ================================ */
  const { data: project, error: pErr } = await supabase
    .from("ccd_projects")
    .select("plant_name, unit_name")
    .eq("id", currentProjectId)
    .single();

  if (pErr || !project) {
    reportDiv.innerHTML = "❌ Project not found";
    return;
  }

  /* ===============================
     FETCH LOOPS → CIRCUITS → DAMAGE
  ================================ */
  const { data: loops, error: lErr } = await supabase
    .from("corrosion_systems")
    .select(`
      system_name,
      process_description,
      circuits (
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
    .eq("project_id", currentProjectId)
    .order("created_at");

  if (lErr || !loops || loops.length === 0) {
    reportDiv.innerHTML = "❌ No corrosion loops found";
    return;
  }

  /* ===============================
     BUILD REPORT
  ================================ */
  let html = `
    <div style="font-family:Arial;font-size:12px;color:#000">

      <h3 style="text-align:center">
        CORROSION CONTROL DOCUMENT (CCD)
      </h3>

      <p>
        <b>Plant:</b> ${project.plant_name}<br>
        <b>Unit:</b> ${project.unit_name}
      </p>

      <hr>
  `;

  loops.forEach((loop, loopIndex) => {

    const sectionNo = `7.${31 + loopIndex}`;

    html += `
      <h4>
        ${sectionNo} Corrosion Loop: ${loop.system_name}
      </h4>

      <b>a) Corrosion Loop Description</b>
      <p>${loop.process_description || "NA"}</p>

      <b>b) Corrosion Loop Process Description</b>
      <p>${loop.process_description || "NA"}</p>
    `;

    if (!loop.circuits || loop.circuits.length === 0) {
      html += `<p><i>No circuits defined</i></p><hr>`;
      return;
    }

    loop.circuits.forEach(circuit => {

      const dms = circuit.circuit_damage_map || [];

      html += `
        <b>c) Operating Parameters</b>
        <ul>
          <li>Operating Temperature: ${circuit.operating_temp ?? "Ambient"}</li>
          <li>Operating Pressure: ${circuit.operating_pressure ?? "NA"}</li>
          <li>Process Fluid: Fuel Gas</li>
          <li>Stream Phase: Gas</li>
        </ul>

        <b>d) Material of Construction</b>
        <p>${circuit.material || "NA"}</p>

        <b>e) Primary Damage Mechanisms</b>
        <ul>
      `;

      if (dms.length === 0) {
        html += `<li>No Damage Mechanism Identified</li>`;
      } else {
        dms.forEach(dm => {
          if (!dm.damage_mechanisms_master) return;
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

        <b>f) Suggested Inspection Techniques</b>
        <ul>
          <li>UTG for piping ≥ 2 inch diameter</li>
          <li>Profile RT for piping ≤ 2 inch diameter</li>
          <li>Visual inspection (External)</li>
        </ul>
      `;
    });

    html += `<hr>`;
  });

  /* ===============================
     FOOTER
  ================================ */
  html += `
      <table style="width:100%;font-size:11px;margin-top:20px">
        <tr>
          <td><b>Company</b></td><td>NRL</td>
          <td><b>Prepared By</b></td><td>CCD Pro System</td>
        </tr>
        <tr>
          <td><b>Plant</b></td><td>${project.plant_name}</td>
          <td><b>Approved By</b></td><td>—</td>
        </tr>
      </table>

    </div>
  `;

  reportDiv.innerHTML = html;
};
