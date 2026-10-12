import { redirect } from 'next/navigation'

// Check-in has been retired; printed QR posters may still point here, so send
// people to the visitor guide instead of a 404.
export default function CheckinPage() {
  redirect('/reserve')
}
