import { redirect } from 'next/navigation'

// Check-in now lives on the Reserve page (QR posters may still point here).
export default function CheckinPage() {
  redirect('/reserve?checkin=1')
}
