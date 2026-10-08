/**
 * MapTiler Cloud API key, used for the default satellite imagery and the
 * vector basemap (see historicalImagery.ts / mapStyle.ts) — both previously
 * pointed at free, no-uptime-guarantee services (arcgisonline.com,
 * tiles.openfreemap.org) that were the main source of "won't load" reports.
 *
 * This is a public client key, not a secret: it's meant to be embedded in
 * the page the same way every MapTiler/Mapbox-style app ships its key, and
 * is protected by restricting it to this site's domain in the MapTiler
 * dashboard (Account → Keys) rather than by hiding it.
 */
export const MAPTILER_KEY = '7oaL0EB84x4yGcQILSxF'
