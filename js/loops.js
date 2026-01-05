import { supabase } from './supabase.js';

window.saveLoop = async function () {
  const name = document.getElementById("loop").value;

  await supabase.from("corrosion_loops").insert([
    { loop_name: name }
  ]);

  alert("Loop Added");
};
