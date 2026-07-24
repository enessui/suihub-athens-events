'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function CheckinQrPage() {
  const [checkinUrl, setCheckinUrl] = useState('')

  useEffect(() => {
    setCheckinUrl(`${window.location.origin}/checkin`)
  }, [])

  const qrSrc = checkinUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&color=030F1C&bgcolor=FFFFFF&data=${encodeURIComponent(checkinUrl)}`
    : null

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-white p-10 text-center print:gap-6">
      <Image
        src="/suihub-logo.png"
        alt="SuiHub"
        width={180}
        height={56}
        className="object-contain"
      />
      <h1 className="text-4xl font-bold tracking-tight text-[#030F1C]">
        Welcome in, check in here
      </h1>
      <p className="max-w-md text-lg text-[#91A3B1]">
        Scan to check in. Free coworking, walk-ins always welcome.
      </p>
      {qrSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrSrc} alt={`QR code for ${checkinUrl}`} className="size-72 print:size-80" />
      )}
      <p className="text-sm text-[#91A3B1]">{checkinUrl}</p>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-[#4DA2FF] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#4DA2FF]/90 print:hidden"
      >
        Print this poster
      </button>
    </main>
  )
}
