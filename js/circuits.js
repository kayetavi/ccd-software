import { supabase } from './supabase.js';

const loopId = localStorage.getItem("loop_id");
const circuitList = document.getElementById("circuitList");

async function loadCircuits() {
  const { data } = await supabase
    .from("circuits")
    .select("*")
    .eq("loop_id", loopId);

  circuitList.innerHTML = "";
  data.forEach(c => {
    circuitList.innerHTML +=
      `<li onclick="selectCircuit('${c.id}')">${c.circuit_name}</li>`;
  });
}

window.saveCircuit = async function () {
  const name = document.getElementById("circuit").value;
  const material = document.getElementById("material").value;

  await supabase.from("circuits").insert([
    { loop_id: loopId, circuit_name: name, material }
  ]);

  loadCircuits();
};

window.selectCircuit = function (id) {
  localStorage.setItem("circuit_id", id);
  location.href = "damage.html";
};

loadCircuits();
