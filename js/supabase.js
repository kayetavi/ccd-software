import { createClient } from
"https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://hbeunczctgzsvxuhdehb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZXVuY3pjdGd6c3Z4dWhkZWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mjk1MzgsImV4cCI6MjA4MzIwNTUzOH0.UpWI8Arpmt5ouf8MAyCTOltKUTMvLRkAYJTukdXGUBU"
);
