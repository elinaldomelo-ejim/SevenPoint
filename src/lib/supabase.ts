import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pejstxduwbgoijnvlibj.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uI1ZAe7r3jzaeDj3wCAKkg_IaP7KVtv';

export const supabase = createClient(supabaseUrl, supabaseKey);
