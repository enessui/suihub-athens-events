export type OriginsContent = {
  heading: string
  intro: string
  /** ISO 3166-1 alpha-2 codes of the countries to show on the map. */
  codes: string[]
}

export const DEFAULT_ORIGINS: OriginsContent = {
  heading: 'Where our coworkers are from',
  intro: '',
  codes: [
    // Europe
    'GR', 'CY', 'TR', 'IT', 'ES', 'PT', 'FR', 'NL', 'DE', 'GB', 'IS',
    'PL', 'CZ', 'SE', 'FI',
    // Americas
    'US', 'CA', 'BR', 'AR',
    // Asia & Middle East
    'AE', 'IN', 'CN', 'TW', 'JP', 'SG', 'ID',
    // Africa & Oceania
    'NG', 'ZA', 'AU',
  ],
}

/**
 * Flag emoji for an alpha-2 code: the two letters as regional indicator
 * symbols. Platforms without flag glyphs (Windows) fall back to showing the
 * letters, which still reads fine next to the country name.
 */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return ''
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  )
}

/**
 * Trusts nothing: uppercases, drops anything that isn't a two-letter code, and
 * removes duplicates. Codes are only shape-checked here so this module stays
 * free of the country table, which would otherwise be pulled into the client
 * bundle; a well-formed code that matches no country simply never renders.
 */
export function normalizeOrigins(input: unknown): OriginsContent {
  const raw = (input ?? {}) as Partial<OriginsContent> & {
    // Earlier shape, before per-country counts were dropped.
    entries?: { code?: unknown }[]
  }

  const source = Array.isArray(raw.codes)
    ? raw.codes
    : Array.isArray(raw.entries)
      ? raw.entries.map((e) => e?.code)
      : []

  const seen = new Set<string>()
  for (const value of source) {
    const code = String(value ?? '').toUpperCase()
    if (/^[A-Z]{2}$/.test(code)) seen.add(code)
  }

  return {
    heading: (raw.heading ?? '').trim() || DEFAULT_ORIGINS.heading,
    intro: typeof raw.intro === 'string' ? raw.intro.trim() : DEFAULT_ORIGINS.intro,
    codes: [...seen],
  }
}
