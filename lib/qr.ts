import QRCode from 'qrcode'

// Generate a QR code as an inline SVG string (server-side). Rendered into a
// white tile on the TV display; a small quiet zone keeps it scannable.
export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#030F1C', light: '#ffffff' },
  })
}
