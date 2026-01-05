import { supabase } from './supabase.js';

window.saveDamage = async function () {
  const name = document.getElementById("damage").value;
  const api = document.getElementById("api").value;

  await supabase.from("damage_mechanisms").insert([
    { mechanism_name: name, api_reference: api }
  ]);

  alert("Damage Saved");
};
