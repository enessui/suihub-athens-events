// Cache tags live in their own module so both the cached readers
// (lib/site-content.ts) and the server actions that invalidate them can import
// them without creating a circular dependency.

/** Editable page content in site_settings + the member count. */
export const SITE_CONTENT_TAG = 'site-content'

/** The events list (public calendar, coworking page, TV display). */
export const EVENTS_TAG = 'events'

/** Anything derived from coworking_checkins: today's count + leaderboards. */
export const CHECKIN_TAG = 'checkins'
