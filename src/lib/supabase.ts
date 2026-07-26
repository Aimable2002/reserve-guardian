import { createClient } from "@supabase/supabase-js";

// Publishable (anon) credentials — safe to ship in the client bundle.
export const SUPABASE_URL = "https://cvrltjcozzfxhgjwtcts.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cmx0amNvenpmeGhnand0Y3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMTAzNTEsImV4cCI6MjEwMDU4NjM1MX0.fYYblETaj5b9hzpHqbNCZBDS3MTG9f9cVw8sqG7Li7k";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});