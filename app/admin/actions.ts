'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { EVENTS_TAG } from '@/lib/cache-tags'
import { createClient } from '@/lib/supabase/server'
import { spaceInputToUtc } from '@/lib/events'

type ActionResult = { error?: string }

// Returns the current user only if they are an allowlisted admin.
async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ userId: string } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: isAdmin, error } = await supabase.rpc('is_admin')
  if (error) return { error: error.message }
  if (!isAdmin) return { error: 'You are not authorized to manage events.' }
  return { userId: user.id }
}

async function uploadImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('event-images')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(`Image upload failed: ${error.message}`)
  const {
    data: { publicUrl },
  } = supabase.storage.from('event-images').getPublicUrl(path)
  return publicUrl
}

function parseForm(formData: FormData) {
  const start = formData.get('start_time') as string
  const end = (formData.get('end_time') as string) || null

  // Registration: either "invite-only" or an optional public URL.
  const regType = (formData.get('registration_type') as string) || 'open'
  let registration_link: string | null
  if (regType === 'invite-only') {
    registration_link = 'invite-only'
  } else {
    registration_link = ((formData.get('registration_link') as string) || '').trim() || null
  }

  return {
    title: (formData.get('title') as string)?.trim(),
    description: ((formData.get('description') as string) || '').trim() || null,
    category: (formData.get('category') as string) || 'General',
    host: ((formData.get('host') as string) || '').trim() || null,
    room: ((formData.get('room') as string) || '').trim() || null,
    industry: ((formData.get('industry') as string) || '').trim() || null,
    registration_link,
    show_on_tv: formData.get('show_on_tv') === 'on',
    start_time: spaceInputToUtc(start),
    end_time: spaceInputToUtc(end),
  }
}

export async function createEvent(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) return { error: auth.error }

  const fields = parseForm(formData)
  if (!fields.title || !fields.start_time) {
    return { error: 'Title and start time are required.' }
  }

  try {
    const uploaded = await uploadImage(
      supabase,
      formData.get('image') as File | null,
    )
    // Uploaded file wins; otherwise use an imported (Luma/Meetup) cover if present.
    const importedImageUrl = ((formData.get('imported_image_url') as string) || '').trim() || null
    const imageUrl = uploaded ?? importedImageUrl
    const { error } = await supabase.from('events').insert({
      ...fields,
      image_url: imageUrl,
      created_by: auth.userId,
    })
    if (error) return { error: error.message }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }

  revalidatePath('/')
  updateTag(EVENTS_TAG)
  revalidatePath('/admin')
  return {}
}

export async function updateEvent(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) return { error: auth.error }

  const fields = parseForm(formData)
  if (!fields.title || !fields.start_time) {
    return { error: 'Title and start time are required.' }
  }

  try {
    const file = formData.get('image') as File | null
    const uploaded = await uploadImage(supabase, file)
    const payload: Record<string, unknown> = { ...fields }
    if (uploaded) {
      // A newly uploaded file always wins.
      payload.image_url = uploaded
    } else if (formData.has('imported_image_url')) {
      // Form sends this field on every submit: a URL keeps/sets the cover,
      // an empty string clears it.
      const imported = ((formData.get('imported_image_url') as string) || '').trim()
      payload.image_url = imported || null
    }

    const { error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', id)
    if (error) return { error: error.message }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }

  revalidatePath('/')
  updateTag(EVENTS_TAG)
  revalidatePath('/admin')
  return {}
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) return { error: auth.error }

  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/')
  updateTag(EVENTS_TAG)
  revalidatePath('/admin')
  return {}
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function inviteAdmin(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) return { error: auth.error }

  const email = ((formData.get('email') as string) || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  const { error } = await supabase
    .from('admin_allowlist')
    .insert({ email, invited_by: auth.userId })
  if (error) {
    if (error.code === '23505') {
      return { error: 'That email is already an admin.' }
    }
    return { error: error.message }
  }

  revalidatePath('/admin')
  return {}
}

export async function removeAdmin(email: string): Promise<ActionResult> {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if ('error' in auth) return { error: auth.error }

  // Don't allow removing the last remaining admin.
  const { count } = await supabase
    .from('admin_allowlist')
    .select('email', { count: 'exact', head: true })
  if ((count ?? 0) <= 1) {
    return { error: 'You cannot remove the last admin.' }
  }

  const { error } = await supabase
    .from('admin_allowlist')
    .delete()
    .eq('email', email.toLowerCase())
  if (error) return { error: error.message }

  revalidatePath('/admin')
  return {}
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
