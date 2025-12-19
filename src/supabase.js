import { createClient } from '@supabase/supabase-js'

// ⚠️ 请把下面两行引号里的内容，换成您刚才复制的真实 URL 和 Key
const supabaseUrl = 'https://ptjficullimxdxrqhgqd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0amZpY3VsbGlteGR4cnFoZ3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDcyNDgsImV4cCI6MjA4MTY4MzI0OH0.atmDyxySFRvIliZqpcsORQWK63REKUEjLB4_vSgyPYM'

export const supabase = createClient(supabaseUrl, supabaseKey)
