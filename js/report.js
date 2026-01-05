import { supabase } from './supabase.js';

const load = async () => {
  const { data } = await supabase.from("damage_mechanisms").select("*");
  document.getElementById("report").innerHTML =
    JSON.stringify(data, null, 2);
};

load();
