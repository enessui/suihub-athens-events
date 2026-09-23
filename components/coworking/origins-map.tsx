import { Globe2 } from 'lucide-react'
import { LAND_PATH, MAP_WIDTH, MAP_HEIGHT, project } from '@/lib/world-map'
import { COUNTRIES, COUNTRY_BY_CODE } from '@/lib/countries'
import { flagEmoji, type OriginsContent } from '@/lib/coworker-origins'
import { OriginsEditor } from '@/components/coworking/origins-editor'

/** The hub everything connects back to. */
const ATHENS = project(23.7275, 37.9838)
const DOT_R = 4.5
// Invisible, larger hit area: keeps the dots small without making them
// fiddly to hover.
const HIT_R = 11

/**
 * A quadratic curve from a country to Athens, bowed away from the straight
 * line by a fraction of its length, so long routes arc more than short ones.
 * The control point is always pushed towards the top of the map, which keeps
 * every arc leaning the same way instead of some bowing up and others down.
 */
function arcTo(x: number, y: number): string | null {
  const dx = ATHENS.x - x
  const dy = ATHENS.y - y
  const dist = Math.hypot(dx, dy)
  // Greece sits on top of Athens: no arc worth drawing.
  if (dist < 12) return null
  let nx = -dy / dist
  let ny = dx / dist
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  const bend = dist * 0.24
  return `M${x} ${y} Q${x + dx / 2 + nx * bend} ${y + dy / 2 + ny * bend} ${ATHENS.x} ${ATHENS.y}`
}

export function OriginsMap({
  content,
  isAdmin,
}: {
  content: OriginsContent
  isAdmin: boolean
}) {
  const { heading, intro, codes } = content

  // Nothing to show yet: stay invisible to visitors, prompt the admin.
  if (codes.length === 0 && !isAdmin) return null

  const places = codes
    .map((code) => COUNTRY_BY_CODE.get(code)!)
    // A stored code that matches no country can't be placed.
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((country) => ({ country, arc: arcTo(country.x, country.y) }))

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Globe2 className="size-5 text-primary" />
            {heading}
          </h2>
          {intro && <p className="mt-1 text-sm text-muted-foreground">{intro}</p>}
        </div>
        {isAdmin && (
          <div className="self-start">
            <OriginsEditor content={content} countries={COUNTRIES} />
          </div>
        )}
      </div>

      {places.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center text-sm text-muted-foreground">
          Nothing on the map yet. Add countries with <span className="font-medium">Edit map</span>.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-[#eaf3fd]">
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              className="block w-full"
              role="img"
              aria-label={`World map connecting SuiHub Athens to ${places.length} countries`}
            >
              <path
                d={LAND_PATH}
                fillRule="evenodd"
                className="fill-[#c8ddf2] stroke-[#eaf3fd]"
                strokeWidth={0.7}
              />

              {/* Routes into the hub, behind everything else. */}
              <g fill="none" className="stroke-primary" strokeLinecap="round">
                {places.map(({ country, arc }) =>
                  arc ? (
                    <path key={country.code} d={arc} strokeWidth={1} strokeOpacity={0.4} />
                  ) : null,
                )}
              </g>

              {/* SuiHub Athens */}
              <g className="pointer-events-none">
                <circle cx={ATHENS.x} cy={ATHENS.y} r={7.5} className="fill-[#eaf3fd]" />
                <circle
                  cx={ATHENS.x}
                  cy={ATHENS.y}
                  r={4.5}
                  className="fill-primary stroke-[#eaf3fd]"
                  strokeWidth={1.8}
                />
                <text
                  x={ATHENS.x}
                  y={ATHENS.y + 21}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{ font: '600 15px var(--font-sans, system-ui)', paintOrder: 'stroke' }}
                  stroke="#eaf3fd"
                  strokeWidth={4}
                  strokeLinejoin="round"
                >
                  SuiHub Athens
                </text>
              </g>

              {places.map(({ country, arc }) => {
                // Keep the label inside the viewBox near the edges.
                const anchor =
                  country.x < 110 ? 'start' : country.x > MAP_WIDTH - 110 ? 'end' : 'middle'
                const flip = country.y < 46 // not enough room above: show below
                return (
                  <g key={country.code} className="group">
                    {arc && (
                      <path
                        d={arc}
                        fill="none"
                        className="pointer-events-none stroke-primary transition-opacity duration-150 group-hover:opacity-100"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        opacity={0}
                      />
                    )}
                    <circle
                      cx={country.x}
                      cy={country.y}
                      r={DOT_R}
                      className="fill-primary stroke-[#eaf3fd]"
                      strokeWidth={1.4}
                    />
                    <text
                      x={country.x}
                      y={flip ? country.y + DOT_R + 20 : country.y - DOT_R - 9}
                      textAnchor={anchor}
                      opacity={0}
                      className="pointer-events-none fill-foreground transition-opacity duration-150 group-hover:opacity-100"
                      style={{ font: '600 15px var(--font-sans, system-ui)', paintOrder: 'stroke' }}
                      stroke="#eaf3fd"
                      strokeWidth={5}
                      strokeLinejoin="round"
                    >
                      {country.name}
                    </text>
                    <circle
                      cx={country.x}
                      cy={country.y}
                      r={HIT_R}
                      fill="transparent"
                      style={{ pointerEvents: 'all' }}
                    >
                      <title>{country.name}</title>
                    </circle>
                  </g>
                )
              })}
            </svg>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            {places.map(({ country }) => (
              <li
                key={country.code}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm"
              >
                <span aria-hidden>{flagEmoji(country.code)}</span>
                <span>{country.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
