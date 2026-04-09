import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR REAL KEYS
const SUPABASE_URL = "https://zkimibxtwwiqqulpqdmj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpraW1pYnh0d3dpcXF1bHBxZG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDQyMzUsImV4cCI6MjA4Njk4MDIzNX0.QS1fvQrRc0ev-u7hxO_rl46aID1ZHQax4Hy7lZahWLQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);