import { cookies } from 'next/headers'

export async function isPreviewMode(): Promise<boolean> {
  const store = await cookies()
  return store.get('preview_mode')?.value === 'true'
}

// Returns effective admin status — false when preview mode is active
export async function getEffectiveIsAdmin(supabaseIsAdmin: boolean): Promise<boolean> {
  if (!supabaseIsAdmin) return false
  const preview = await isPreviewMode()
  return !preview
}
