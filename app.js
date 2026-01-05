// 🔑 Replace with your Supabase keys
const supabaseUrl = "https://apmmvovefgywogzcnvmr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbW12b3ZlZmd5d29nemNudm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDA4ODQsImV4cCI6MjA4MjkxNjg4NH0.B0KRW0-OoV_11E_ism4_3xwusP85syna3UMy3kZy3gU";

const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 🔐 LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
  } else {
    window.location.href = "equipment.html";
  }
}

// 🏭 ADD EQUIPMENT (CCD STEP-1)
async function addEquipment() {
  const data = {
    tag_no: document.getElementById("tag").value,
    equipment_type: document.getElementById("type").value,
    service: document.getElementById("service").value,
    material: document.getElementById("material").value,
    design_temp: document.getElementById("temp").value,
    design_pressure: document.getElementById("pressure").value,
    insulated: document.getElementById("insulated").value === "true"
  };

  const { error } = await supabase
    .from("equipment")
    .insert([data]);

  if (error) {
    document.getElementById("msg").innerText = error.message;
  } else {
    document.getElementById("msg").innerText =
      "Equipment saved successfully (CCD updated)";
  }
}

// 🔄 Load Equipment List
async function loadEquipment() {
  const { data, error } = await supabase
    .from("equipment")
    .select("id, tag_no, material, design_temp, insulated");

  if (error) {
    alert(error.message);
    return;
  }

  const select = document.getElementById("equipmentSelect");
  select.innerHTML = "";

  data.forEach(eq => {
    const opt = document.createElement("option");
    opt.value = eq.id;
    opt.text = eq.tag_no;
    opt.dataset.material = eq.material;
    opt.dataset.temp = eq.design_temp;
    opt.dataset.insulated = eq.insulated;
    select.appendChild(opt);
  });
}

// 🔍 Auto Damage Mechanism Suggestion
async function loadDamageMechanisms() {
  const select = document.getElementById("equipmentSelect");
  const option = select.options[select.selectedIndex];

  const material = option.dataset.material;
  const temp = parseFloat(option.dataset.temp);
  const insulated = option.dataset.insulated === "true";

  let { data, error } = await supabase
    .from("damage_mechanisms")
    .select("*")
    .lte("temp_min", temp)
    .gte("temp_max", temp);

  if (error) {
    alert(error.message);
    return;
  }

  const container = document.getElementById("dmList");
  container.innerHTML = "";

  data.forEach(dm => {
    if (
      dm.material === material ||
      dm.material === "All" ||
      (dm.name === "CUI" && insulated)
    ) {
      const div = document.createElement("div");
      div.innerHTML = `
        <input type="checkbox" id="${dm.id}">
        <b>${dm.name}</b> (${dm.dm_type})<br>
        <textarea id="j_${dm.id}" placeholder="Justification"></textarea><br><br>
      `;
      container.appendChild(div);
    }
  });

  const btn = document.createElement("button");
  btn.innerText = "Save to CCD";
  btn.onclick = saveDamageMechanisms;
  container.appendChild(btn);
}

// 💾 Save Accepted Damage Mechanisms
async function saveDamageMechanisms() {
  const equipId = document.getElementById("equipmentSelect").value;

  const checkboxes = document.querySelectorAll("#dmList input[type=checkbox]");
  for (let cb of checkboxes) {
    if (cb.checked) {
      const justification =
        document.getElementById("j_" + cb.id).value;

      await supabase.from("equipment_dm").insert([
        {
          equipment_id: equipId,
          damage_mechanism_id: cb.id,
          justification: justification
        }
      ]);
    }
  }

  alert("Damage Mechanisms saved (CCD updated)");
}

// Auto load equipment on page open
window.onload = loadEquipment;

// ▶ Run RBI for all equipment (call SQL function)
async function runRBI() {
  const { data, error } = await supabase
    .rpc("generate_rbi_for_all");

  if (error) {
    alert(error.message);
  } else {
    alert("RBI calculation completed");
    loadRbiDashboard();
  }
}

// 📊 Load RBI Dashboard
async function loadRbiDashboard() {
  const { data, error } = await supabase
    .from("rbi_results")
    .select(`
      pof,
      cof,
      risk,
      next_inspection_year,
      equipment ( tag_no )
    `);

  if (error) {
    alert(error.message);
    return;
  }

  document.getElementById("highRisk").innerHTML = "";
  document.getElementById("mediumRisk").innerHTML = "";
  document.getElementById("lowRisk").innerHTML = "";

  data.forEach(r => {
    const row = `
      <tr>
        <td>${r.equipment.tag_no}</td>
        <td>${r.pof}</td>
        <td>${r.cof}</td>
        <td>${r.risk}</td>
        <td>${r.next_inspection_year}</td>
      </tr>
    `;

    if (r.risk === "High")
      document.getElementById("highRisk").innerHTML += row;
    else if (r.risk === "Medium")
      document.getElementById("mediumRisk").innerHTML += row;
    else
      document.getElementById("lowRisk").innerHTML += row;
  });
}

// Auto load on page open
window.onload = loadRbiDashboard;
