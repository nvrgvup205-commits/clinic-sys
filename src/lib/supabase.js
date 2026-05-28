import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cfbxoqkxibhztovhyxqn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmYnhvcWt4aWJoenRvdmh5eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDM5NjAsImV4cCI6MjA5MzY3OTk2MH0.bi7fLHfJ01nqThYIAUyUY-F4vLiLZ8R3TvCqrRcJNNU'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})

// ═══════════════════════════════════════════════════════════
// 📸 رفع الصور - Storage Helpers
// ═══════════════════════════════════════════════════════════
export const uploadImage = async (bucket, file, prefix = '') => {
  if (!file) return { url: null, error: 'لم يتم اختيار ملف' }
  if (file.size > 5 * 1024 * 1024) return { url: null, error: 'حجم الملف يجب أن يكون أقل من 5 ميجابايت' }

  const ext = file.name.split('.').pop()
  const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: false })

  if (error) return { url: null, error: error.message }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return { url: publicUrl, path: fileName, error: null }
}

export const deleteImage = async (bucket, path) => {
  if (!path) return { error: null }
  const fileName = path.split('/').pop()
  return await supabase.storage.from(bucket).remove([fileName])
}
