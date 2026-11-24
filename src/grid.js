// Counting squares for a busy point map: counts by area while zoomed out, single marks up close.
//
// Why: sizing marks by weight (weight.js) lets the major filings stand out, but far out the rest is still
// a haze of dots that says "busy here" and never "how busy". So while the map is zoomed out, the points in
// a dense place are counted in a square with the number written in it, and the square splits as the
// reader zooms in: into four smaller squares at each zoom level, then into single marks at `split`.
//
// The squares are the map's own tile grid cut `depth` levels finer, so a square is the same piece of
// ground every time. It does not drift or re-form the way a floating cluster does, and "splits into four"
// is literally what happens. With the default depth of 3, a square is between 64 and 128 pixels across on
// screen at every zoom (for 512-pixel tiles, as MapLibre draws them).
//
// A square is only drawn where it holds `min` points or more. Below that the points stay single marks, so
// a lone permit in the country is a dot, not a square with a "1" in it. Major points are counted like the
// rest; draw them on top as marks as well: the count says how much, the marks say which ones matter.
import { MAJOR } from './weight.js'   // with its extension, so a plain Node script can run this file too

export const DEFAULTS = {
  from: 7,       // the map's lowest zoom
  split: 10,     // the zoom from which every point is its own mark
  depth: 3,      // a square is one eighth of a map tile on each side
  min: 8,        // fewer points than this in a square stay single marks
  gap: 0.012,    // each square is drawn this much short of its edge, so neighbours do not fuse
  corner: 0.07,  // the number sits this far inside the square's top left corner, like the day in a calendar box
}

// Web Mercator tile coordinates, as fractions, at a level; and back
const toTile = (lng, lat, n) => {
  const r = (lat * Math.PI) / 180
  return [((lng + 180) / 360) * n, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n]
}
const toLngLat = (x, y, n) => [+((x / n) * 360 - 180).toFixed(5), +((Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI).toFixed(5)]

// events: [{ id, p: [lng, lat], w }], where w is the point's weight (weight.js). Returns
//   areas  a GeoJSON FeatureCollection: each square is a Polygon with { lvl: the zoom it is drawn at, n: its
//          count, label: the count written out, t: 0 to 1, how full it is next to the fullest square at that
//          zoom }, followed by a Point with the same properties where its number is written
//   from   id -> the zoom from which that point is drawn as its own mark (`from` when it is never in a square)
export function groupByArea(events, options = {}) {
  const { from: FROM, split: SPLIT, depth: DEPTH, min: MIN, gap: GAP, corner: CORNER } = { ...DEFAULTS, ...options }
  const from = new Map()
  const features = []
  // Only major points showing (say, a "major only" filter): they are all marks already, so count nothing
  const worthCounting = events.some(e => e.w !== MAJOR)
  for (let zoom = FROM; worthCounting && zoom < SPLIT; zoom++) {
    const n = 2 ** (zoom + DEPTH)
    const bins = new Map()
    for (const e of events) {
      const [fx, fy] = toTile(e.p[0], e.p[1], n)
      const x = Math.floor(fx), y = Math.floor(fy), key = x * n + y
      const bin = bins.get(key)
      if (bin) bin.ids.push(e.id); else bins.set(key, { x, y, ids: [e.id] })
    }
    const full = [...bins.values()].filter(b => b.ids.length >= MIN)
    const most = full.reduce((m, b) => Math.max(m, b.ids.length), 0)
    for (const b of full) {
      const count = b.ids.length
      const nw = toLngLat(b.x + GAP, b.y + GAP, n), se = toLngLat(b.x + 1 - GAP, b.y + 1 - GAP, n)
      const properties = { lvl: zoom, n: count, label: count.toLocaleString('en-US'), t: +Math.sqrt(count / most).toFixed(3) }
      features.push({ type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: [[[nw[0], nw[1]], [se[0], nw[1]], [se[0], se[1]], [nw[0], se[1]], [nw[0], nw[1]]]] } })
      // In the corner, not the middle: the middle of a busy square is where its major marks and its town's name are
      features.push({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: toLngLat(b.x + CORNER, b.y + CORNER, n) } })
      // A square's points are inside a square at every lower zoom too (a parent square holds at least as
      // many), so the last zoom a point is counted at is all that has to be remembered
      for (const id of b.ids) from.set(id, zoom + 1)
    }
  }
  return { areas: { type: 'FeatureCollection', features }, from: id => from.get(id) || FROM }
}
