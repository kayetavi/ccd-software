import { supabase } from './supabase.js';

window.saveConstituents = async () => {

  if (!window.activeCircuitId) {
    alert("❌ Circuit select karo pehle");
    return;
  }

  const payload = {
    circuit_id: window.activeCircuitId,
    h2s: document.getElementById("h2s").value || null,
    co2: document.getElementById("co2").value || null,
    o2: document.getElementById("o2").value || null,
    chlorides: document.getElementById("chlorides").value || null
  };

  // check existing row
  const { data: existing } = await supabase
    .from("circuit_constituents")
    .select("id")
    .eq("circuit_id", window.activeCircuitId)
    .single();

  let res;

  if (existing) {
    res = await supabase
      .from("circuit_constituents")
      .update(payload)
      .eq("circuit_id", window.activeCircuitId);
  } else {
    res = await supabase
      .from("circuit_constituents")
      .insert(payload);
  }

  if (res.error) {
    alert(res.error.message);
    return;
  }

  document.getElementById("constituentStatus").innerHTML =
    "✅ Constituents saved successfully";
};
