import { supabase } from './supabase.js';
import { currentProjectId } from './dashboard.js';

/* ===============================
   GENERATE CCD REPORT (FINAL)
================================ */
window.generateReport = async () => {

  const reportSection = document.getElementById("reportSection");
  const reportDiv = document.getElementById("ccdReport");

  reportSection.style.display = "block";
  reportDiv.innerHTML = "<i>Generating CCD report...</i>";

  const projectId =
    currentProjectId || localStorage.getItem("activeProjectId");

  if (!projectId) {
    reportDiv.innerHTML = "❌ No active project selected";
    return;
  }

  /* ===============================
     FETCH PROJECT
  ================================ */
  const { data: project, error: pErr } = await supabase
    .from("ccd_projects")
    .select("plant_name, unit_name")
    .eq("id", projectId)
    .single();

  if (pErr || !project) {
    reportDiv.innerHTML = "❌ Project not found";
    return;
  }

  /* ===============================
     FETCH FULL CCD STRUCTURE
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

        process_fluid_master ( name ),
        stream_phase_master ( name ),

        circuit_constituents (
          h2s,
          co2,
          o2,
          chlorides
        ),

        circuit_damage_map (
          damage_mechanisms_master (
            name,
            api_reference
          )
        ),

        circuit_inspections (
          inspection_techniques_master (
            technique,
            category
          )
        )
      )
    `)
    .eq("project_id", projectId)
    .order("created_at");

  if (lErr) {
    reportDiv.innerHTML = `❌ ${lErr.message}`;
    return;
  }

  if (!loops || loops.length === 0) {
    reportDiv.innerHTML = "❌ No corrosion loops found for this project";
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
      <h4>${sectionNo} Corrosion Loop: ${loop.system_name}</h4>

      <b>a) Corrosion Loop Description</b>
      <p>${loop.process_description || "NA"}</p>

      <b>b) Corrosion Loop Process Description</b>
      <p>${loop.process_description || "NA"}</p>
    `;

    if (!loop.circuits || loop.circuits.length === 0) {
      html += `<p><i>No circuits defined</i></p><hr>`;
      return;
    }

    loop.circuits.forEach((circuit, idx) => {

      const dms = circuit.circuit_damage_map || [];
      const inspections = circuit.circuit_inspections || [];
      const cc = circuit.circuit_constituents?.[0] || {};

      html += `
        <h5 style="margin-top:15px">
          Circuit ${idx + 1}: ${circuit.circuit_name}
        </h5>

        <b>c) Operating Parameters</b>
        <ul>
          <li>Operating Temperature: ${circuit.operating_temp ?? "NA"} °C</li>
          <li>Operating Pressure: ${circuit.operating_pressure ?? "NA"} bar</li>
          <li>Process Fluid: ${circuit.process_fluid_master?.name ?? "NA"}</li>
          <li>Stream Phase: ${circuit.stream_phase_master?.name ?? "NA"}</li>
        </ul>

        <b>d) Critical Process Constituents</b>
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px">
          <tr>
            <td>H2S</td><td>${cc.h2s ?? "NA"}</td>
          </tr>
          <tr>
            <td>CO2</td><td>${cc.co2 ?? "NA"}</td>
          </tr>
          <tr>
            <td>O2</td><td>${cc.o2 ?? "NA"}</td>
          </tr>
          <tr>
            <td>Chlorides</td><td>${cc.chlorides ?? "NA"}</td>
          </tr>
        </table>

        <b>e) Material of Construction</b>
        <p>${circuit.material || "NA"}</p>

        <b>f) Primary Damage Mechanisms</b>
        <ul>
      `;

      if (dms.length === 0) {
        html += `<li>NA</li>`;
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

        <b>j) Suggested Inspection Techniques</b>
        <ul>
      `;

      if (inspections.length === 0) {
        html += `<li>NA</li>`;
      } else {
        inspections.forEach(i => {
          const tech = i.inspection_techniques_master;
          if (!tech) return;
          html += `<li>${tech.technique} (${tech.category})</li>`;
        });
      }

      html += `</ul>`;
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

/* ===============================
   PDF DOWNLOAD
================================ */
window.downloadPDF = () => {

  const report = document.getElementById("ccdReport");

  if (!report || report.innerHTML.trim() === "") {
    alert("Please generate report first");
    return;
  }

  html2pdf().set({
    margin: 10,
    filename: 'CCD_Report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(report).save();
};
