import { supabase } from './supabase'

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
