// Helpers for the admin-controlled Home page media (video or photo).

export function formatBytes(n) {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  return Math.max(1, Math.round(n / 1024)) + ' KB'
}

export const isDriveUrl = (s) => /(drive|docs)\.google\.com/i.test(String(s || ''))

// Pulls the file id out of any normal Google Drive share link
export function extractDriveId(input) {
  const s = String(input || '').trim()
  const m = s.match(/\/d\/([a-zA-Z0-9_-]{15,})/) || s.match(/[?&]id=([a-zA-Z0-9_-]{15,})/)
  return m ? m[1] : null
}

// Drive photos: the thumbnail endpoint serves a real image.
// Drive videos: the download endpoint streams small files; the thumbnail is used as the poster.
export function driveToMedia(id, type) {
  if (type === 'image') return { url: `https://drive.google.com/thumbnail?id=${id}&sz=w1600`, poster: '' }
  return {
    url: `https://drive.google.com/uc?export=download&id=${id}`,
    poster: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`
  }
}

// Cloudinary delivers a smaller, faster copy when we ask for it in the URL
export function cloudinaryOptimize(url, type) {
  const m = String(url).match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/)(v\d+\/.+)$/)
  if (!m) return url
  return m[1] + (type === 'image' ? 'q_auto,f_auto,w_1200,c_limit/' : 'q_auto,w_900,c_limit/') + m[2]
}

// A still frame from a Cloudinary video, shown while the video loads
export function cloudinaryPoster(url) {
  const m = String(url).match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(?:[^/]+\/)?(v\d+\/.+?)(?:\.[a-z0-9]+)?$/i)
  return m ? m[1] + 'so_0,q_auto,w_800,c_limit/' + m[2] + '.jpg' : ''
}
