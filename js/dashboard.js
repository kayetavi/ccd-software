import { supabase } from './supabase.js';

export let currentProjectId = null;

window.createProject = async () => {
  const plant = document.getElementById("plant").value;
  const unit = document.getElementById("unit").value;

  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('ccd_projects')
    .insert({
      plant_name: plant,
      unit_name: unit,
      user_id: user.id
    })
    .select()
    .single();

  if (!error) {
    currentProjectId = data.id;
    alert("CCD Project Created");
  } else alert(error.message);
};
