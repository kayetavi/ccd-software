import { supabase } from './supabase.js';

const systemId = localStorage.getItem("system_id");

window.addCircuit = async () => {
  const { error } = await supabase
    .from('circuits')
    .insert({
      system_id: systemId,
      circuit_name: circuitName.value,
      material: material.value,
      operating_temp: temp.value,
      operating_pressure: pressure.value
    });

  if (!error) loadCircuits();
  else alert(error.message);
};

async function loadCircuits() {
  const { data } = await supabase
    .from('circuits')
    .select('*')
    .eq('system_id', systemId);

  circuits.innerHTML = "";
  data.forEach(c => {
    circuits.innerHTML += `
      <div class="box">
        <b>${c.circuit_name}</b><br>
        ${c.material} | ${c.operating_temp}°C
      </div>`;
  });
}

loadCircuits();

const circuitName = document.getElementById("circuitName");
const material = document.getElementById("material");
const temp = document.getElementById("temp");
const pressure = document.getElementById("pressure");
const circuits = document.getElementById("circuits");
