'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { escapeHtml } from '@/lib/notify'

export type GalleryImage = {
  id: string
  url: string
  caption: string | null
  created_at: string
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' as const, userId: null, userClient: null }
  const { data: { user } } = await supabase.auth.getUser()
  return { error: null, userId: user?.id ?? null, userClient: supabase }
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gallery_images')
    .select('id, url, caption, created_at')
    .order('created_at', { ascending: false })
  return (data ?? []) as GalleryImage[]
}

export async function uploadGalleryImage(
  formData: FormData,
): Promise<{ error?: string }> {
  const { error: authError, userId, userClient } = await requireAdmin()
  if (authError || !userClient) return { error: authError ?? 'Not authorized' }

  const file = formData.get('image') as File | null
  const caption = ((formData.get('caption') as string) ?? '').trim() || null

  if (!file || file.size === 0) return { error: 'No file selected.' }

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('gallery')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = admin.storage.from('gallery').getPublicUrl(path)
  const { error: dbError } = await admin.from('gallery_images').insert({
    url: publicUrl,
    caption,
    uploaded_by: userId,
  })
  if (dbError) return { error: dbError.message }

  revalidatePath('/gallery')
  return {}
}

// Public: visitors email their photos to the SuiHub team for review
export async function submitVisitorPhotos(
  formData: FormData,
): Promise<{ error?: string }> {
  const name = ((formData.get('name') as string) ?? '').trim()
  const email = ((formData.get('email') as string) ?? '').trim()
  const note = ((formData.get('note') as string) ?? '').trim()
  const files = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)

  if (!name) return { error: 'Please enter your name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email.' }
  if (files.length === 0) return { error: 'Please attach at least one photo.' }
  if (files.length > 5) return { error: 'Maximum 5 photos per submission.' }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  if (totalSize > 20 * 1024 * 1024) return { error: 'Photos must be under 20MB in total.' }

  const attachments = await Promise.all(
    files.map(async (f) => ({
      filename: f.name || 'photo.jpg',
      content: Buffer.from(await f.arrayBuffer()),
    })),
  )

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeNote = escapeHtml(note)

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'SuiHub Gallery <onboarding@resend.dev>',
      to: 'suihubathens@sui.io',
      subject: `Gallery photo submission from ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="margin-bottom: 4px;">Gallery Photo Submission</h2>
          <p style="color: #888; margin-top: 0;">Submitted via SuiHub Athens Gallery</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 8px 0; color: #666; width: 140px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${safeName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Photos</td><td style="padding: 8px 0;">${files.length} attached</td></tr>
          </table>
          ${safeNote ? `
          <div style="margin-top: 20px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0 0 8px; font-weight: 600;">Note</p>
            <p style="margin: 0; color: #444; white-space: pre-line;">${safeNote}</p>
          </div>` : ''}
        </div>
      `,
      attachments,
    })
    if (error) return { error: 'Could not send your photos. Please try again later.' }
  } catch {
    return { error: 'Could not send your photos. Please try again later.' }
  }

  return {}
}

export async function deleteGalleryImage(
  id: string,
): Promise<{ error?: string }> {
  const { error: authError, userClient } = await requireAdmin()
  if (authError || !userClient) return { error: authError ?? 'Not authorized' }

  const admin = createAdminClient()

  const { data: row } = await admin
    .from('gallery_images')
    .select('url')
    .eq('id', id)
    .single()

  if (row?.url) {
    const path = row.url.split('/gallery/').pop()
    if (path) await admin.storage.from('gallery').remove([path])
  }

  const { error } = await admin.from('gallery_images').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/gallery')
  return {}
}
