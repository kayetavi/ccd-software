// ===============================
// SUPABASE CONFIG (FIXED)
// ===============================
const supabaseUrl = "https://apmmvovefgywogzcnvmr.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbW12b3ZlZmd5d29nemNudm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDA4ODQsImV4cCI6MjA4MjkxNjg4NH0.B0KRW0-OoV_11E_ism4_3xwusP85syna3UMy3kZy3gU";

// ⚠️ IMPORTANT FIX
const supabase = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

// ===============================
// LOGIN
// ===============================
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login failed: " + error.message);
  } else {
    alert("Login successful ✅");
    window.location.href = "equipment.html";
  }
}

// ===============================
// EQUIPMENT (CCD STEP-1)
// ===============================
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
    alert(error.message);
  } else {
    alert("Equipment saved (CCD updated) ✅");
  }
}

// ===============================
// LOAD EQUIPMENT
// ===============================
async function loadEquipment() {
  const { data, error } = await supabase
    .from("equipment")
    .select("id, tag_no, material, design_temp, insulated");

  if (error) {
    alert(error.message);
    return;
  }

  const select = document.getElementById("equipmentSelect");
  if (!select) return;

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

// ===============================
// DAMAGE MECHANISM LOGIC
// ===============================
async function loadDamageMechanisms() {
  const select = document.getElementById("equipmentSelect");
  if (!select) return;

  const option = select.options[select.selectedIndex];
  const material = option.dataset.material;
  const temp = parseFloat(option.dataset.temp);
  const insulated = option.dataset.insulated === "true";

  const { data, error } = await supabase
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
      container.innerHTML += `
        <div>
          <input type="checkbox" id="${dm.id}">
          <b>${dm.name}</b> (${dm.dm_type})<br>
          <textarea id="j_${dm.id}" placeholder="Justification"></textarea>
        </div><br>
      `;
    }
  });
}

// ===============================
// SAVE DAMAGE MECHANISMS
// ===============================
async function saveDamageMechanisms() {
  const equipId = document.getElementById("equipmentSelect").value;
  const checks = document.querySelectorAll("#dmList input[type=checkbox]");

  for (let cb of checks) {
    if (cb.checked) {
      await supabase.from("equipment_dm").insert([{
        equipment_id: equipId,
        damage_mechanism_id: cb.id,
        justification: document.getElementById("j_" + cb.id).value
      }]);
    }
  }

  alert("Damage mechanisms saved (CCD updated) ✅");
}
