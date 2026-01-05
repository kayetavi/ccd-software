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
