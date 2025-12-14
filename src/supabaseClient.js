const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eypvirimkniozkemrneb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHZpcmlta25pb3prZW1ybmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzQ0MjcsImV4cCI6MjA4MTI1MDQyN30.S5LBkkw55mXR6n0lF0Z41bzPCUldm8casRKISmS4ExU';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
