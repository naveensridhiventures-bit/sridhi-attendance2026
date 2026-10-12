import React, { useEffect, useRef, useState } from 'react'
import { getHomeHero, setHomeHero, removeHomeHeroItem } from '../api/sheetApi.js'
import { useToast } from './Toast.jsx'
import HomeHero from './HomeHero.jsx'
import { SPEED_MUL } from './HeroEffects.jsx'
import { CLOUDINARY } from '../config/cloudinary.js'
import {
  extractDriveId, isDriveUrl, driveToMedia, cloudinaryOptimize, cloudinaryPoster, formatBytes
} from '../utils/heroMedia.js'

const HERO_CACHE = 'sv-home-hero'
const MODES = [
  { key: 'default', label: 'Dragon', sub: 'Default' },
  { key: 'video', label: 'Video', sub: 'Looping' },
  { key: 'image', label: 'Photo', sub: 'Slow zoom' }
]
const GREETINGS = ['Welcome back', 'Happy Pongal 🌾', 'Happy Diwali 🪔', 'Happy New Year 🎉', 'Team of the month 🏆']

const ANIMATIONS = [
  { key: 'zoom', label: 'Slow zoom', hint: 'Gentle push-in' },
  { key: 'pan', label: 'Cinematic pan', hint: 'Sweeps side to side' },
  { key: 'drift', label: 'Floating drift', hint: 'Dreamy, wandering' },
  { key: 'breathe', label: 'Breathing', hint: 'Soft in and out' },
  { key: 'reveal', label: 'Curtain reveal', hint: 'Wipes in on open' },
  { key: 'none', label: 'Still', hint: 'No movement' }
]
const SPEEDS = [
  { key: 'slow', label: 'Slow' },
  { key: 'normal', label: 'Normal' },
  { key: 'fast', label: 'Fast' }
]
const EFFECTS = [
  { key: 'sparkles', label: 'Sparkles', icon: '✨' },
  { key: 'sweep', label: 'Light sweep', icon: '💡' },
  { key: 'bokeh', label: 'Glow orbs', icon: '🫧' },
  { key: 'confetti', label: 'Confetti', icon: '🎊' }
]
// One tap sets motion, speed and effects together
const PRESETS = [
  { key: 'festival', label: '🎉 Festival', animation: 'reveal', speed: 'normal', effects: ['sparkles', 'confetti'] },
  { key: 'calm', label: '🌿 Calm', animation: 'breathe', speed: 'slow', effects: ['bokeh'] },
  { key: 'premium', label: '✨ Premium', animation: 'pan', speed: 'slow', effects: ['sweep'] },
  { key: 'energy', label: '⚡ Energetic', animation: 'drift', speed: 'fast', effects: ['sparkles', 'sweep'] }
]

// What counts as "changed". Motion only matters for photos; speed only when something moves.
const sig = (h) => JSON.stringify({
  t: h?.type || 'default',
  u: h?.url || '',
  hl: (h?.headline || '').trim(),
  st: (h?.subtext || '').trim(),
  a: h?.type === 'image' ? (h.animation ?? 'zoom') : '',
  sp: h?.type === 'image' || (h?.effects || []).length ? (h?.speed || 'normal') : '',
  fx: [...(h?.effects || [])].sort()
})
const MAX_VIDEO = 60 * 1024 * 1024
const MAX_IMAGE = 10 * 1024 * 1024

const EMPTY = { type: 'default', url: '', poster: '', headline: '', subtext: '', animation: 'zoom', speed: 'normal', effects: [], source: '' }

// Admin screen: choose what the Home page hero shows — the dragon video, your own video, or a photo.
// Media is stored on Cloudinary (upload from here) or Google Drive (paste a share link); only the link is saved.
export default function HomeHeroManager() {
  const showToast = useToast()
  const fileRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(null)       // hero currently live
  const [library, setLibrary] = useState([])
  const [draft, setDraft] = useState(EMPTY)
  const [source, setSource] = useState('upload') // upload | link
  const [linkText, setLinkText] = useState('')
  const [linkHint, setLinkHint] = useState('')
  const [upload, setUpload] = useState(null)     // { pct, name, size }
  const [dragOver, setDragOver] = useState(false)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getHomeHero()
      .then((d) => {
        setSaved(d.hero || null)
        setLibrary(d.library || [])
        if (d.hero) setDraft({ ...EMPTY, ...d.hero })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => setFailed(false), [draft.url])

  // Turn whatever the admin pastes into a playable link
  useEffect(() => {
    if (source !== 'link') return
    const t = linkText.trim()
    if (!t) { setLinkHint(''); return }
    if (draft.type === 'default') { setLinkHint('Pick Video or Photo above first.'); return }
    if (isDriveUrl(t)) {
      const id = extractDriveId(t)
      if (!id) { setLinkHint('That does not look like a Google Drive file link.'); return }
      const m = driveToMedia(id, draft.type)
      setDraft((d) => ({ ...d, url: m.url, poster: m.poster, source: 'drive' }))
      setLinkHint('')
    } else if (/^https:\/\//i.test(t)) {
      const isCld = t.includes('res.cloudinary.com/')
      const url = isCld ? cloudinaryOptimize(t, draft.type) : t
      const poster = draft.type === 'video' && isCld && t.includes('/video/') ? cloudinaryPoster(url) : ''
      setDraft((d) => ({ ...d, url, poster, source: isCld ? 'cloudinary' : 'link' }))
      setLinkHint('')
    } else {
      setLinkHint('Paste a link that starts with https://')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkText, source, draft.type])

  function chooseMode(key) {
    setDraft((d) => (key === d.type ? d : { ...d, type: key, url: '', poster: '', source: '' }))
    setLinkText('')
    setLinkHint('')
  }

  function pickFile(file) {
    if (!file) return
    const isVid = file.type.startsWith('video/')
    const isImg = file.type.startsWith('image/')
    if (draft.type === 'video' && !isVid) return showToast('Choose a video file (MP4 or MOV).', 'error')
    if (draft.type === 'image' && !isImg) return showToast('Choose a photo (JPG, PNG or WEBP).', 'error')
    const limit = isVid ? MAX_VIDEO : MAX_IMAGE
    if (file.size > limit) return showToast(`That file is ${formatBytes(file.size)}. The limit is ${formatBytes(limit)}.`, 'error')
    uploadToCloudinary(file)
  }

  function uploadToCloudinary(file) {
    setUpload({ pct: 0, name: file.name, size: file.size })
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', CLOUDINARY.preset)
    fd.append('folder', 'sridhi-home')
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/auto/upload`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUpload((u) => (u ? { ...u, pct: Math.round((e.loaded / e.total) * 100) } : u))
    }
    xhr.onload = () => {
      let data = {}
      try { data = JSON.parse(xhr.responseText) } catch (_) { /* ignore */ }
      setUpload(null)
      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
        const type = data.resource_type === 'video' ? 'video' : 'image'
        const url = cloudinaryOptimize(data.secure_url, type)
        setDraft((d) => ({ ...d, type, url, poster: type === 'video' ? cloudinaryPoster(url) : '', source: 'cloudinary' }))
        showToast('Uploaded. Check the preview, then publish.', 'success')
      } else {
        showToast('Cloudinary says: ' + (data.error?.message || `upload failed (${xhr.status})`), 'error')
      }
    }
    xhr.onerror = () => {
      setUpload(null)
      showToast('Upload failed. Check your internet connection and try again.', 'error')
    }
    xhr.send(fd)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    pickFile(e.dataTransfer.files?.[0])
  }

  function useFromLibrary(item) {
    setDraft((d) => ({ ...d, type: item.type, url: item.url, poster: item.poster || '', source: 'library' }))
    showToast('Loaded into the preview. Publish to make it live.', 'info')
  }

  async function removeFromLibrary(item) {
    try {
      const r = await removeHomeHeroItem(item.url)
      setLibrary(r.library || [])
    } catch (e) {
      showToast(e.message || 'Could not remove it', 'error')
    }
  }

  const mediaChosen = draft.type === 'default' || Boolean(draft.url)
  const dirty = sig(draft) !== sig(saved)
  const canPublish = dirty && mediaChosen && !upload && !saving

  async function publish() {
    setSaving(true)
    try {
      const r = await setHomeHero({
        type: draft.type, url: draft.url, poster: draft.poster, headline: draft.headline, subtext: draft.subtext,
        animation: draft.animation, speed: draft.speed, effects: draft.effects, source: draft.source
      })
      setSaved(r.hero || null)
      setLibrary(r.library || [])
      try {
        if (r.hero) localStorage.setItem(HERO_CACHE, JSON.stringify(r.hero))
        else localStorage.removeItem(HERO_CACHE)
      } catch (_) { /* ignore */ }
      showToast('Home page updated. Everyone sees it the next time they open the app.', 'success')
    } catch (e) {
      showToast(e.message || 'Could not publish', 'error')
    } finally {
      setSaving(false)
    }
  }

  const modeIdx = Math.max(0, MODES.findIndex((m) => m.key === draft.type))
  const previewHero = { ...draft, type: draft.url ? draft.type : 'default' }
  const spdMul = SPEED_MUL[draft.speed] ?? 1

  function toggleEffect(key) {
    setDraft((d) => ({ ...d, effects: d.effects.includes(key) ? d.effects.filter((x) => x !== key) : [...d.effects, key] }))
  }
  function applyPreset(pr) {
    setDraft((d) => ({ ...d, animation: pr.animation, speed: pr.speed, effects: pr.effects }))
  }

  return (
    <div className="space-y-4">
      {/* Live preview — the same hero people see on the Home page */}
      <div className="rise" style={{ '--i': 0 }}>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="font-display font-semibold text-ink text-sm">Home page preview</p>
          <span className={`text-[10px] font-semibold rounded-full px-2.5 py-1 ${dirty ? 'bg-gold-400/20 text-gold-500' : 'bg-brand-100 text-brand-700'}`}>
            {loading ? 'Loading…' : dirty ? 'Not published yet' : 'Live now'}
          </span>
        </div>
        <HomeHero hero={previewHero} headline={draft.headline.trim() || undefined} subtext={draft.subtext} preview onMediaFail={() => setFailed(true)} />
        {failed && (
          <div className="mt-2 rounded-xl bg-rust/10 border border-rust/30 px-3 py-2.5 text-[11px] text-rust leading-relaxed">
            This file can't be played, so the default is showing. For Google Drive, set sharing to <b>Anyone with the link</b>.
            Large Drive videos often fail — upload the video here instead.
          </div>
        )}
      </div>

      <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card space-y-4 rise" style={{ '--i': 1 }}>
        {/* What to show */}
        <div>
          <p className="text-xs font-semibold text-ink mb-2">What should the Home page show?</p>
          <div className="relative grid grid-cols-3 bg-surface rounded-2xl p-1">
            <span
              aria-hidden="true"
              className="nav-pill absolute top-1 bottom-1 left-1 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-soft"
              style={{ width: 'calc((100% - 0.5rem) / 3)', transform: `translateX(${modeIdx * 100}%)` }}
            />
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => chooseMode(m.key)}
                className={`relative py-2 rounded-xl text-center transition-colors duration-300 ${draft.type === m.key ? 'text-white' : 'text-slate-500'}`}
              >
                <span className="block text-xs font-semibold">{m.label}</span>
                <span className="block text-[9px] opacity-70">{m.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Where the file comes from */}
        {draft.type !== 'default' && (
          <div className="space-y-3 animate-popIn">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'upload', label: 'Upload a file', hint: 'Cloudinary' },
                { key: 'link', label: 'Paste a link', hint: 'Google Drive or any https link' }
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSource(s.key)}
                  className={`text-left rounded-xl border px-3 py-2 transition-all duration-300 ${
                    source === s.key ? 'border-brand-400 bg-brand-50 shadow-card' : 'border-brand-100 bg-white'
                  }`}
                >
                  <span className="block text-xs font-semibold text-ink">{s.label}</span>
                  <span className="block text-[10px] text-slate-400">{s.hint}</span>
                </button>
              ))}
            </div>

            {source === 'upload' ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !upload && fileRef.current?.click()}
                className={`rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-300 ${
                  dragOver ? 'border-brand-500 bg-brand-50 scale-[1.01]' : 'border-brand-200 hover:border-brand-400'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={draft.type === 'video' ? 'video/*' : 'image/*'}
                  className="hidden"
                  onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }}
                />
                {upload ? (
                  <div>
                    <p className="text-xs font-semibold text-ink truncate">{upload.name}</p>
                    <p className="text-[10px] text-slate-400 mb-3">{formatBytes(upload.size)} · uploading to Cloudinary</p>
                    <div className="h-2 rounded-full bg-brand-50 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-400 transition-all duration-300" style={{ width: `${upload.pct}%` }} />
                    </div>
                    <p className="text-[11px] font-semibold text-brand-600 mt-2">{upload.pct}%</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center mx-auto mb-2 shadow-soft animate-iconBounce">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-ink">
                      {draft.type === 'video' ? 'Choose a video, or drop it here' : 'Choose a photo, or drop it here'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {draft.type === 'video' ? 'MP4 or MOV, up to 60 MB. A 10–20 second loop works best.' : 'JPG, PNG or WEBP, up to 10 MB. Landscape photos look best.'}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  inputMode="url"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Paste a Google Drive share link"
                  className="input text-sm"
                />
                {linkHint && <p className="text-[11px] text-rust mt-1.5">{linkHint}</p>}
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  In Drive: right-click the file → Share → General access → <b>Anyone with the link</b>, then copy the link.
                  Photos work well. For videos, uploading is more reliable.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Motion & effects */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-ink mb-2">Quick styles</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((pr) => (
                <button
                  key={pr.key}
                  onClick={() => applyPreset(pr)}
                  className="text-[11px] rounded-full border border-brand-200 bg-brand-50 text-brand-700 px-3 py-1.5 font-semibold active:scale-95 transition-transform"
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {draft.type === 'image' && (
            <div className="animate-popIn">
              <p className="text-xs font-semibold text-ink mb-2">Photo animation</p>
              <div className="grid grid-cols-3 gap-2">
                {ANIMATIONS.map((an) => {
                  const on = (draft.animation ?? 'zoom') === an.key
                  return (
                    <button
                      key={an.key}
                      onClick={() => setDraft((d) => ({ ...d, animation: an.key }))}
                      className={`text-left rounded-xl border p-1.5 transition-all duration-300 ${
                        on ? 'border-brand-500 bg-brand-50 shadow-soft scale-[1.03]' : 'border-brand-100 bg-white'
                      }`}
                    >
                      <span
                        key={`${an.key}-${on}`}
                        className={`block relative w-full h-14 rounded-lg overflow-hidden bg-brand-800 ${an.key === 'reveal' ? 'hero-wipe' : ''}`}
                        style={{ '--spd': spdMul }}
                      >
                        <span className={`absolute inset-0 ${an.key !== 'none' ? `hero-anim hero-anim-${an.key}` : ''}`}>
                          {draft.type === 'image' && draft.url ? (
                            <img src={draft.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <>
                              <span className="absolute inset-0 bg-gradient-to-br from-brand-400 via-brand-600 to-gold-500" />
                              <span className="absolute w-5 h-5 rounded-full bg-white/80 left-[28%] top-[22%]" />
                              <span className="absolute w-3 h-3 rounded-full bg-gold-400 right-[22%] bottom-[24%]" />
                            </>
                          )}
                        </span>
                      </span>
                      <span className="block text-[11px] font-semibold text-ink mt-1.5 leading-tight">{an.label}</span>
                      <span className="block text-[9px] text-slate-400 leading-tight">{an.hint}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-ink mb-2">Effects <span className="font-normal text-slate-400">(pick any)</span></p>
            <div className="grid grid-cols-2 gap-1.5">
              {EFFECTS.map((fx) => {
                const on = draft.effects.includes(fx.key)
                return (
                  <button
                    key={fx.key}
                    onClick={() => toggleEffect(fx.key)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all duration-300 ${
                      on ? 'border-brand-500 bg-brand-50 shadow-card' : 'border-brand-100 bg-white'
                    }`}
                  >
                    <span className="text-lg">{fx.icon}</span>
                    <span className="text-xs font-semibold text-ink flex-1">{fx.label}</span>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] text-white transition-all ${on ? 'bg-brand-500 border-brand-500' : 'border-slate-300'}`}>
                      {on ? '✓' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {(draft.type === 'image' || draft.effects.length > 0) && (
            <div className="animate-popIn">
              <p className="text-xs font-semibold text-ink mb-2">Speed</p>
              <div className="grid grid-cols-3 gap-1.5 bg-surface rounded-2xl p-1">
                {SPEEDS.map((sp) => (
                  <button
                    key={sp.key}
                    onClick={() => setDraft((d) => ({ ...d, speed: sp.key }))}
                    className={`py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                      draft.speed === sp.key ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft' : 'text-slate-500'
                    }`}
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Greeting */}
        <div>
          <p className="text-xs font-semibold text-ink mb-2">Greeting on the Home page</p>
          <input
            type="text"
            maxLength={120}
            value={draft.headline}
            onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
            placeholder="Welcome back"
            className="input text-sm"
          />
          <div className="flex items-end justify-between mt-3 mb-1.5">
            <p className="text-xs font-semibold text-ink">Message under the greeting <span className="font-normal text-slate-400">(optional)</span></p>
            <p className="text-[10px] text-slate-400">{draft.subtext.length} / 500</p>
          </div>
          <textarea
            rows={4}
            maxLength={500}
            value={draft.subtext}
            onChange={(e) => setDraft((d) => ({ ...d, subtext: e.target.value }))}
            placeholder={'Write a few lines for everyone.\nPress Enter for a new line.'}
            className="input resize-y leading-relaxed text-sm"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {GREETINGS.map((g) => (
              <button
                key={g}
                onClick={() => setDraft((d) => ({ ...d, headline: g === 'Welcome back' ? '' : g }))}
                className="text-[11px] rounded-full border border-brand-100 bg-surface px-2.5 py-1 text-slate-600 active:scale-95"
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <button onClick={publish} disabled={!canPublish} className="w-full btn-primary py-3 text-sm">
          {saving ? 'Publishing…' : !dirty ? 'Nothing to publish' : !mediaChosen ? 'Add a file or link first' : 'Publish to Home page'}
        </button>
      </div>

      {/* Previously used */}
      {library.length > 0 && (
        <div className="bg-white border border-brand-50 rounded-2xl p-4 shadow-card rise" style={{ '--i': 2 }}>
          <p className="text-xs font-semibold text-ink mb-0.5">Previously used</p>
          <p className="text-[10px] text-slate-400 mb-3">Tap one to bring it back into the preview.</p>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
            {library.map((item, i) => (
              <div key={item.id || item.url} className="relative shrink-0 rise" style={{ '--i': i + 3 }}>
                <button
                  onClick={() => useFromLibrary(item)}
                  className={`block w-28 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    draft.url === item.url ? 'border-brand-500 scale-[1.03] shadow-soft' : 'border-brand-100'
                  } bg-brand-800`}
                >
                  {item.type === 'image' ? (
                    <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : item.poster ? (
                    <img src={item.poster} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <video src={item.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                  )}
                  <span className="absolute left-1.5 bottom-1.5 text-[9px] font-semibold text-white bg-black/55 rounded-full px-1.5 py-0.5">
                    {item.type === 'image' ? 'Photo' : 'Video'}
                  </span>
                </button>
                <button
                  onClick={() => removeFromLibrary(item)}
                  aria-label="Remove from list"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rust text-white text-[10px] leading-none flex items-center justify-center shadow-card"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
