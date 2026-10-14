// CSV export for the admin pages.

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const esc = (v: unknown) => {
    let s = v === null || v === undefined ? '' : String(v)
    // Much of this data is typed by the public. A value starting with = + - @
    // would run as a formula when the file is opened in Excel or Sheets, so
    // prefix it with a quote to keep it as plain text.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = columns.join(',')
  const body = rows.map((r) => columns.map((c) => esc(r[c])).join(',')).join('\n')
  return `${header}\n${body}`
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
