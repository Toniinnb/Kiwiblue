import { createClient } from '@supabase/supabase-js'

// ⚠️ 请把下面两行引号里的内容，换成您刚才复制的真实 URL 和 Key
const supabaseUrl = 'https://您的ProjectURL.supabase.co'
const supabaseKey = '您的anon_key_一大长串'

export const supabase = createClient(supabaseUrl, supabaseKey)
