import { supabase } from './supabase.js';

window.saveCircuit = async function () {
  const name = document.getElementById("circuit").value;
  const material = document.getElementById("material").value;

  await supabase.from("circuits").insert([
    { circuit_name: name, material: material }
  ]);

  alert("Circuit Added");
};
