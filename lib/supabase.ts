import { createClient } from '@supabase/supabase-js';

// On ajoute le "!" à la fin pour forcer TypeScript à comprendre 
// que ces variables ne seront jamais "undefined".
// Elles proviennent de notre fichier .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Création et exportation du client Supabase
// Ce client sera importé dans nos composants pour faire nos requêtes (CRUD)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);