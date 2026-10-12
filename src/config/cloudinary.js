// Cloudinary (free plan is enough). Uploads go straight from the browser using an
// UNSIGNED upload preset, so no secret key is ever stored in the app.
// Dashboard → Settings → Upload → Upload presets: the preset must be "Unsigned".
export const CLOUDINARY = {
  cloudName: 'djwgtjdda',
  preset: 'sridhi-hero'
}
