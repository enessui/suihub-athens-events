import fs from 'node:fs'
const dir = '/private/tmp/claude-501/-Users-eneshoxha-Downloads-sui-hub-athens-events-calendar-app/54f0ad94-8db1-40a7-bd45-5e0336758bc6/scratchpad'

const topo = JSON.parse(fs.readFileSync(`${dir}/countries-110m.json`, 'utf8'))
const iso = JSON.parse(fs.readFileSync(`${dir}/iso3166.json`, 'utf8'))
const cent = JSON.parse(fs.readFileSync(`${dir}/centroids.geojson`, 'utf8'))

// ---- projection: equirectangular, Antarctica cropped ----
const W = 1000, LAT_MAX = 84, LAT_MIN = -56
const H = +(W * (LAT_MAX - LAT_MIN) / 360).toFixed(0)
const px = (lon) => (lon + 180) / 360 * W
const py = (lat) => (LAT_MAX - Math.min(LAT_MAX, Math.max(LAT_MIN, lat))) / (LAT_MAX - LAT_MIN) * H

// ---- decode topojson arcs ----
const { scale: [sx, sy], translate: [tx, ty] } = topo.transform
const arcs = topo.arcs.map((deltas) => {
  let x = 0, y = 0
  return deltas.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty] })
})
const arcOf = (i) => (i < 0 ? arcs[~i].slice().reverse() : arcs[i])
function ring(indices) {
  const pts = []
  for (const i of indices) {
    const a = arcOf(i)
    for (let k = pts.length ? 1 : 0; k < a.length; k++) pts.push(a[k])
  }
  return pts
}
function polygons(geom) {
  if (geom.type === 'Polygon') return [geom.arcs.map(ring)]
  if (geom.type === 'MultiPolygon') return geom.arcs.map((p) => p.map(ring))
  return []
}

// ---- build the land path ----
function ringArea(pts) {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
  }
  return a / 2
}

// Ramer-Douglas-Peucker: drops points that sit within `tol` of the line they
// span, which is most of them on a 110m coastline at this display size.
function simplify(pts, tol) {
  if (pts.length < 5) return pts
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  const t2 = tol * tol
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = pts[a], [bx, by] = pts[b]
    const dx = bx - ax, dy = by - ay
    const den = dx * dx + dy * dy
    let far = -1, best = t2
    for (let i = a + 1; i < b; i++) {
      const [x, y] = pts[i]
      let d
      if (den === 0) { const ex = x - ax, ey = y - ay; d = ex * ex + ey * ey }
      else {
        let t = ((x - ax) * dx + (y - ay) * dy) / den
        t = t < 0 ? 0 : t > 1 ? 1 : t
        const ex = x - (ax + t * dx), ey = y - (ay + t * dy)
        d = ex * ex + ey * ey
      }
      if (d > best) { best = d; far = i }
    }
    if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]) }
  }
  return pts.filter((_, i) => keep[i])
}

const TOL = 0.7 // projected units; ~0.5px at the size the map renders
const MIN_AREA = 1.2 // projected units² — drops specks too small to see
let d = ''
for (const geom of topo.objects.countries.geometries) {
  for (const poly of polygons(geom)) {
    for (const r of poly) {
      // Rings that straddle the antimeridian (Fiji, Chukotka, NZ's Chathams)
      // would otherwise be drawn as a streak straight across the map. Unwrap
      // them past +180, then emit a second copy shifted a full world left; the
      // viewBox clips whichever half falls outside.
      const lons = r.map((p) => p[0])
      const wraps = Math.max(...lons) - Math.min(...lons) > 180
      let proj = r.map(([lon, lat]) => [px(wraps && lon < 0 ? lon + 360 : lon), py(lat)])
      if (Math.abs(ringArea(proj)) < MIN_AREA) continue
      proj = simplify(proj, TOL)
      const snapped = []
      for (const [x0, y0] of proj) {
        const x = Math.round(x0), y = Math.round(y0)
        const last = snapped[snapped.length - 1]
        if (!last || last[0] !== x || last[1] !== y) snapped.push([x, y])
      }
      if (snapped.length < 4) continue
      const emit = (dx) => 'M' + snapped.map(([x, y]) => `${x + dx} ${y}`).join('L') + 'Z'
      d += emit(0)
      if (wraps) d += emit(-W)
    }
  }
}


// ---- country table: ISO alpha-2 + name + projected centroid ----
const byIso = new Map()
for (const f of cent.features) {
  const code = f.properties.ISO
  if (!code || code.length !== 2) continue
  const [lon, lat] = f.geometry.coordinates
  if (!byIso.has(code)) byIso.set(code, [lon, lat])
}
// Geometric centroids that land badly for map-reading purposes.
const OVERRIDE = {
  FR: [2.5, 46.6], US: [-98.5, 39.5], NL: [5.3, 52.2], NO: [9.5, 61.5],
  PT: [-8.2, 39.7], ES: [-3.7, 40.2], RU: [55, 58], DK: [9.5, 56], FI: [26, 63],
  GB: [-2.0, 53.5], NZ: [172.5, -41.5], CL: [-71, -35], EC: [-78.5, -1.5],
  IN: [79, 22], CN: [104, 35], GR: [23.7, 38.5],
  // Absent from the centroid dataset, so placed by hand.
  TW: [121, 23.7],
}
const names = new Map(iso.map((c) => [c['alpha-2'], c.name]))
// Shorter, friendlier display names than the formal ISO ones.
const RENAME = {
  GB: 'United Kingdom', US: 'United States', RU: 'Russia', KR: 'South Korea',
  KP: 'North Korea', VN: 'Vietnam', IR: 'Iran', SY: 'Syria', TZ: 'Tanzania',
  BO: 'Bolivia', VE: 'Venezuela', MD: 'Moldova', CZ: 'Czechia', TW: 'Taipei',
  LA: 'Laos', BN: 'Brunei', CD: 'DR Congo', AE: 'United Arab Emirates',
  MK: 'North Macedonia', PS: 'Palestine', HK: 'Hong Kong', MO: 'Macao',
  NL: 'Netherlands', TR: 'Turkey', FM: 'Micronesia', FK: 'Falkland Islands',
  VG: 'British Virgin Islands', VI: 'U.S. Virgin Islands', CC: 'Cocos Islands',
  SH: 'Saint Helena', BQ: 'Caribbean Netherlands', MF: 'Saint Martin',
  SX: 'Sint Maarten', IO: 'British Indian Ocean Territory',
}
const rows = []
for (const [code, name] of names) {
  const ll = OVERRIDE[code] ?? byIso.get(code)
  if (!ll) continue
  rows.push({ code, name: RENAME[code] ?? name, x: +px(ll[0]).toFixed(1), y: +py(ll[1]).toFixed(1) })
}
rows.sort((a, b) => a.name.localeCompare(b.name))

const banner = (what) => `// GENERATED FILE — do not edit by hand.
// ${what}
// Source: world-atlas countries-110m (Natural Earth, public domain) + ISO 3166-1.
// Equirectangular projection, Antarctica cropped. Regenerate with
// \`node scripts/gen-world-map.mjs\` (see the script for the source URLs).
`

const mapOut = `${banner('World outline for the coworker origins map.')}
export const MAP_WIDTH = ${W}
export const MAP_HEIGHT = ${H}

/** Latitude band the projection covers: Antarctica is cropped off the bottom. */
export const LAT_MAX = ${LAT_MAX}
export const LAT_MIN = ${LAT_MIN}

/** Project WGS84 lon/lat into the MAP_WIDTH x MAP_HEIGHT space. */
export function project(lon: number, lat: number): { x: number; y: number } {
  const clamped = Math.min(LAT_MAX, Math.max(LAT_MIN, lat))
  return {
    x: ((lon + 180) / 360) * MAP_WIDTH,
    y: ((LAT_MAX - clamped) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT,
  }
}

/** Every country outline as a single SVG path. Render with fill-rule="evenodd". */
export const LAND_PATH =
  '${d}'
`

const listOut = `${banner('Country list with map coordinates.')}
export type Country = {
  /** ISO 3166-1 alpha-2 */
  code: string
  name: string
  /** Centroid in the MAP_WIDTH x MAP_HEIGHT space of lib/world-map.ts */
  x: number
  y: number
}

export const COUNTRIES: Country[] = ${JSON.stringify(rows, null, 0)
  .replace(/\},\{/g, ' },\n  { ')
  .replace(/^\[\{/, '[\n  { ')
  .replace(/\}\]$/, ' },\n]')}

export const COUNTRY_BY_CODE: ReadonlyMap<string, Country> = new Map(
  COUNTRIES.map((c) => [c.code, c]),
)
`

const root = '/Users/eneshoxha/Downloads/sui-hub-athens-events-calendar-app'
fs.writeFileSync(`${root}/lib/world-map.ts`, mapOut)
fs.writeFileSync(`${root}/lib/countries.ts`, listOut)
console.log('viewBox', W, H)
console.log('land path chars', d.length, '->', (mapOut.length / 1024).toFixed(1), 'KB')
console.log('countries', rows.length, '->', (listOut.length / 1024).toFixed(1), 'KB')
