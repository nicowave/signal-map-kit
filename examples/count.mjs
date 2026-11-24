// Weigh a few made-up filings, then count them in squares, the way a map would before drawing.
//   node examples/count.mjs
import { weigh, groupByArea } from '../index.js'

const filings = [
  { k: 'permit', y: 'New Construction', c: 'DC' },
  { k: 'permit', y: 'Residential Electrical', v: 2000, c: 'Montgomery' },
  { k: 'sale', v: 3100000, c: 'Arlington' },
  ...Array.from({ length: 12 }, () => ({ k: 'permit', y: 'Plumbing', c: 'DC' })),
]

// Spread them over a few blocks of downtown Washington
const events = filings.map((f, i) => ({ id: i, p: [-77.036 + (i % 4) * 0.002, 38.9 + Math.floor(i / 4) * 0.002], w: weigh(f) }))

const { areas, from } = groupByArea(events)
for (const f of areas.features.filter(f => f.geometry.type === 'Polygon')) {
  console.log(`zoom ${f.properties.lvl}: a square holding ${f.properties.label}`)
}
console.log(`weights: ${events.map(e => e.w).join(' ')}`)
console.log(`filing 0 becomes its own mark from zoom ${from(0)}`)
