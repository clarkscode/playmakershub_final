import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAdminKey = import.meta.env.VITE_SUPABASE_ADMIN;
export const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);
