import { supabase } from './supabase'

export const FOOTER_PRESETS = [
  'Thank you for your business. Payment due within 7 days.',
  'Please complete payment via the UPI QR code on the invoice page.',
  'Kindly share the payment reference once the transfer is complete.',
  'Thank you for the opportunity to work together.'
]

const PROFILE_ASSET_BUCKET = 'instabill-assets'
const MAX_ASSET_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg']

export async function getMyProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error('We could not verify your session. Please sign in again.')
  }

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, business_name, display_name, upi_id, gstin, logo_path, signature_path, footer_text, invoice_counter'
    )
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error('We could not load your profile right now.')
  }

  return data
}

export function hasCompletedProfile(profile) {
  if (!profile) return false

  const hasName = Boolean(
    profile.display_name || profile.business_name || profile.full_name
  )

  return hasName && Boolean(profile.upi_id)
}

export function getProfileAssetUrl(path) {
  if (!path) {
    return ''
  }

  const { data } = supabase.storage.from(PROFILE_ASSET_BUCKET).getPublicUrl(path)
  return data?.publicUrl ?? ''
}

export function validateProfileAsset(file, assetLabel) {
  if (!file) {
    return null
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const mimeType = file.type.toLowerCase()

  if (extension === 'heic' || extension === 'heif' || mimeType.includes('heic') || mimeType.includes('heif')) {
    return `${assetLabel} must be PNG, JPG, or SVG. HEIC is not supported.`
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `${assetLabel} must be a PNG, JPG, or SVG file.`
  }

  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    return `${assetLabel} must be a PNG, JPG, or SVG file.`
  }

  if (file.size > MAX_ASSET_SIZE_BYTES) {
    return `${assetLabel} must be smaller than 2 MB.`
  }

  return null
}

function getAssetExtension(file) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  return ALLOWED_EXTENSIONS.includes(extension) ? extension : 'png'
}

function getAssetContentType(file, extension) {
  if (file.type) {
    return file.type
  }

  if (extension === 'svg') return 'image/svg+xml'
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
  return 'image/png'
}

export async function uploadProfileAsset({ file, userId, kind }) {
  const extension = getAssetExtension(file)
  const assetPath = `${userId}/${kind}-${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from(PROFILE_ASSET_BUCKET)
    .upload(assetPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: getAssetContentType(file, extension),
    })

  if (error) {
    throw new Error(`We could not upload your ${kind}. Please try again.`)
  }

  return assetPath
}
