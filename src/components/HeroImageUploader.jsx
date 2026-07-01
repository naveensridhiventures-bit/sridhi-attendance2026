import React, { useEffect, useState } from 'react'
import { getHeroImage, setHeroImage } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'

// ─── CONFIGURE THESE TWO VALUES ───────────────────────────────────────────────
// 1. Go to https://cloudinary.com → Settings → Upload → Upload presets
//    Create an UNSIGNED preset and paste the name below.
// 2. Find your Cloud Name on the Cloudinary dashboard top-left.
const CLOUD_NAME  = 'REPLACE_YOUR_CLOUD_NAME'   // e.g. 'dxyz123ab'
const UPLOAD_PRESET = 'REPLACE_YOUR_UPLOAD_PRESET' // e.g. 'sridhi_hero'
// ──────────────────────────────────────────────────────────────────────────────

export default function HeroImageUploader() {
  const showToast = useToast()
  const [current, setCurrent] = useState(null)   // { imageUrl, caption, updatedAt }
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loadingCurrent, setLoadingCurrent] = useState(true)

  useEffect(() => {
    getHeroImage()
      .then((d) => {
        setCurrent(d.heroImage)
        setCaption(d.heroImage?.caption || '')
      })
      .catch(() => {})
      .finally(() => setLoadingCurrent(false))
  }, [])

  function handleFilePick(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleUpload() {
    if (!file) {
      showToast('Please choose an image first.', 'error')
      return
    }
    if (CLOUD_NAME === 'REPLACE_YOUR_CLOUD_NAME') {
      showToast('Set CLOUD_NAME and UPLOAD_PRESET in HeroImageUploader.jsx first.', 'error')
      return
    }
    setUploading(true)
    try {
      // Upload directly to Cloudinary (unsigned preset — no secret exposed)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder', 'sridhi-hero')

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Cloudinary upload failed: ' + res.status)
      const data = await res.json()
      const imageUrl = data.secure_url

      // Save URL + caption to Google Sheet Settings tab via Apps Script
      await setHeroImage(imageUrl, caption)
      setCurrent({ imageUrl, caption, updatedAt: new Date().toLocaleString('en-IN') })
      setFile(null)
      setPreview(null)
      showToast('Hero image updated! It will appear in the Attendance tab.', 'success')
    } catch (e) {
      showToast('Upload failed: ' + e.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleClear() {
    try {
      await setHeroImage('', '')
      setCurrent(null)
      setCaption('')
      showToast('Hero image cleared — default photo restored.', 'info')
    } catch (e) {
      showToast('Failed: ' + e.message, 'error')
    }
  }

  return (
    <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="font-display font-semibold text-ink text-sm">Attendance Hero Image</p>
          <p className="text-[11px] text-slate-400">Upload for birthdays, festivals, announcements — shows in the Attendance tab</p>
        </div>
      </div>

      {/* Current image */}
      {loadingCurrent ? (
        <div className="h-24 rounded-xl skeleton" />
      ) : current?.imageUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-brand-100">
          <img src={current.imageUrl} alt="Current hero" className="w-full h-32 object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 px-3 py-2">
            <p className="text-white text-xs font-medium truncate">{current.caption || 'No caption'}</p>
            <p className="text-white/60 text-[10px]">{current.updatedAt}</p>
          </div>
          <button onClick={handleClear} className="absolute top-2 right-2 bg-rust text-white rounded-lg px-2.5 py-1 text-[11px] font-semibold">
            Clear
          </button>
        </div>
      ) : (
        <div className="h-14 rounded-xl bg-surface border border-brand-100 flex items-center justify-center text-xs text-slate-400">
          No hero image set — default photo avatar is showing
        </div>
      )}

      {/* Upload new */}
      <div className="space-y-2.5">
        <label className="block cursor-pointer">
          <div className={`w-full border-2 border-dashed rounded-xl p-4 text-center transition-colors ${preview ? 'border-brand-300 bg-brand-50' : 'border-brand-100 hover:border-brand-300'}`}>
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-28 object-cover rounded-lg mx-auto" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-brand-400 mb-1">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <p className="text-xs text-slate-500">Tap to choose image</p>
                <p className="text-[10px] text-slate-400 mt-0.5">JPG / PNG / WEBP — max 10MB</p>
              </>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
        </label>

        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption — e.g. 🎂 Happy Birthday Ramesh! 🎉"
          className="input text-sm"
        />

        <button onClick={handleUpload} disabled={uploading} className="w-full btn-primary py-3 text-sm">
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" /></svg>
              Uploading to Cloudinary…
            </span>
          ) : '↑ Upload & Set as Hero Image'}
        </button>
      </div>
    </div>
  )
}
