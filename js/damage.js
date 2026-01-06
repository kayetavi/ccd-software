import { supabase } from './supabase.js';

const circuitId = localStorage.getItem("circuit_id");
const list = document.getElementById("damageList");

async function loadDamage() {
  const { data } = await supabase
    .from("damage_mechanisms")
    .select("*")
    .eq("circuit_id", circuitId);

  list.innerHTML = "";
  data.forEach(d => {
    list.innerHTML += `<li>${d.mechanism_name}</li>`;
  });
}

window.saveDamage = async function () {
  const name = document.getElementById("damage").value;
  const api = document.getElementById("api").value;

  await supabase.from("damage_mechanisms").insert([
    { circuit_id: circuitId, mechanism_name: name, api_reference: api }
  ]);

  loadDamage();
};

loadDamage();
