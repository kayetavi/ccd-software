import { supabase } from './supabase.js';

/* ===============================
   GENERATE CCD REPORT
================================ */
window.generateReport = async () => {

  const reportSection = document.getElementById("reportSection");
  const reportDiv = document.getElementById("reportContent");

  if (!reportDiv) {
    alert("reportContent div missing");
    return;
  }

  reportSection.style.display = "block";
  reportDiv.innerHTML = "<i>Generating CCD report...</i>";

  /* ===============================
     FETCH PROJECT
  ================================ */
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!projects || projects.length === 0) {
    reportDiv.innerHTML = "❌ No project found";
    return;
  }

  const project = projects[0];

  /* ===============================
     FETCH LOOPS → CIRCUITS → DAMAGE
  ================================ */
  const { data: loops } = await supabase
    .from('systems')
    .select(`
      id,
      name,
      description,
      circuits (
        id,
        name,
        material,
        temp,
        pressure,
        circuit_damage_map (
          damage_mechanisms_master ( name, api_reference )
        )
      )
    `)
    .eq('project_id', project.id);

  if (!loops || loops.length === 0) {
    reportDiv.innerHTML = "❌ No loops found";
    return;
  }

  /* ===============================
     BUILD REPORT HTML
  ================================ */
  let html = `
    <h3>📄 Corrosion Control Document (CCD)</h3>

    <b>Plant:</b> ${project.plant}<br>
    <b>Unit:</b> ${project.unit}<br>
    <hr>
  `;

  loops.forEach((loop, i) => {
    html += `
      <h4>${i + 1}. Loop / System: ${loop.name}</h4>
      <p>${loop.description || ""}</p>
    `;

    if (!loop.circuits || loop.circuits.length === 0) {
      html += `<i>No circuits defined</i>`;
      return;
    }

    loop.circuits.forEach((circuit, j) => {
      html += `
        <div style="margin-left:20px">
          <b>${i + 1}.${j + 1} Circuit:</b> ${circuit.name}<br>
          Material: ${circuit.material}<br>
          Operating Temp: ${circuit.temp} °C<br>
          Pressure: ${circuit.pressure} bar<br>

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
