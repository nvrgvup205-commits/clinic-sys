import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { uploadImage, deleteImage } from '../lib/supabase'

export default function ImageUpload({
  bucket = 'clinic-logos',
  currentUrl = '',
  onUpload,
  label = 'صورة',
  shape = 'square', // square | circle | rectangle
  prefix = ''
}) {
  const [preview, setPreview] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('❌ يرجى اختيار صورة فقط')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ حجم الصورة يجب أن يكون أقل من 5MB')
      return
    }

    // Preview محلي
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)

    // رفع للسيرفر
    setUploading(true)
    const { url, error } = await uploadImage(bucket, file, prefix)
    setUploading(false)

    if (error) {
      alert('❌ خطأ في الرفع: ' + error)
      setPreview(currentUrl)
    } else {
      setPreview(url)
      onUpload && onUpload(url)
    }
  }

  const handleRemove = async () => {
    if (currentUrl && currentUrl.includes('supabase')) {
      await deleteImage(bucket, currentUrl)
    }
    setPreview('')
    onUpload && onUpload('')
  }

  const shapeClass = {
    square: 'rounded-2xl aspect-square',
    circle: 'rounded-full aspect-square',
    rectangle: 'rounded-2xl aspect-video'
  }[shape] || 'rounded-2xl aspect-square'

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-bold text-slate-700">{label}</label>}

      <div className="flex items-center gap-3">
        {/* Preview */}
        {preview ? (
          <div className={`relative w-24 ${shapeClass} overflow-hidden border-2 border-sky-300 shadow-lg group`}>
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              handleFile(e.dataTransfer.files[0])
            }}
            className={`upload-zone w-24 ${shapeClass} flex flex-col items-center justify-center cursor-pointer text-sky-600 ${dragging ? 'dragging' : ''}`}
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">رفع</span>
              </>
            )}
          </div>
        )}

        {/* Button */}
        <div className="flex-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md disabled:opacity-50 btn-medical"
          >
            <ImageIcon className="w-4 h-4" />
            {preview ? 'تغيير الصورة' : 'اختر صورة'}
          </button>
          <p className="text-xs text-slate-500 mt-1">PNG, JPG (حتى 5MB)</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />
    </div>
  )
}
