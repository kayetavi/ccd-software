import { supabase } from './supabase.js';

const projectId = localStorage.getItem("project_id");
const loopList = document.getElementById("loopList");

async function loadLoops() {
  const { data } = await supabase
    .from("corrosion_loops")
    .select("*")
    .eq("project_id", projectId);

  loopList.innerHTML = "";
  data.forEach(l => {
    loopList.innerHTML +=
      `<li onclick="selectLoop('${l.id}')">${l.loop_name}</li>`;
  });
}

window.saveLoop = async function () {
  const loop = document.getElementById("loop").value;
  const desc = document.getElementById("desc").value;

  await supabase.from("corrosion_loops").insert([
    { project_id: projectId, loop_name: loop, process_description: desc }
  ]);

  loadLoops();
};

window.selectLoop = function (id) {
  localStorage.setItem("loop_id", id);
  location.href = "circuits.html";
};

loadLoops();
