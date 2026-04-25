import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Client za backend (service key — bypass RLS)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Client za user operacije (respektuje RLS)
export const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)