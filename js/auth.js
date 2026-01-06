import { supabase } from './supabase.js';

window.login = async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { error } = await supabase.auth.signInWithPassword({
    email, password
  });

  if (!error) location.href = "dashboard.html";
  else alert(error.message);
};

window.signup = async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { error } = await supabase.auth.signUp({
    email, password
  });

  if (!error) alert("Signup successful, now login");
  else alert(error.message);
};

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
