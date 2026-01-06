import { supabase } from './supabase.js';
import { currentProjectId } from './dashboard.js';

window.addSystem = async () => {
  if (!currentProjectId) {
    alert("Create project first");
    return;
  }

  const name = systemName.value;
  const desc = systemDesc.value;

  const { data, error } = await supabase
    .from('corrosion_systems')
    .insert({
      project_id: currentProjectId,
      system_name: name,
      process_description: desc
    })
    .select();

  if (!error) loadSystems();
  else alert(error.message);
};

async function loadSystems() {
  const { data } = await supabase
    .from('corrosion_systems')
    .select('*')
    .eq('project_id', currentProjectId);

  const div = document.getElementById("systems");
  div.innerHTML = "";

  data.forEach(sys => {
    div.innerHTML += `
      <div class="box">
        <b>${sys.system_name}</b>
        <br>
        <button onclick="openCircuits('${sys.id}')">Add Circuits</button>
      </div>`;
  });
}

window.openCircuits = (id) => {
  localStorage.setItem("system_id", id);
  location.href = "report.html";
};

const systemName = document.getElementById("systemName");
const systemDesc = document.getElementById("systemDesc");
