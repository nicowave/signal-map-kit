// How much a public filing weighs on a map: MAJOR, EVERYDAY or SMALL.
//
// Why: a week of building permits, zoning cases and property sales across a metro area runs to thousands
// of filings, and about half of them are small trade jobs (a water heater, a new circuit, a gas line).
// Drawn alike, they bury the few a property owner wants to hear about: a new building, a house coming
// down, a sale in the millions, a zoning case. So every filing gets one of three weights, and the map
// sizes its mark by it:
//
//   MAJOR     a new building, a demolition, building work declared at BIG_PERMIT or more,
//             a sale at BIG_SALE or more, and every zoning case
//   EVERYDAY  the rest of the building work (additions, alterations, repairs) and the other sales
//   SMALL     trade and repair jobs, minor structures and paperwork
//
// The weight comes only from what a public record already carries: its kind, the county's own permit
// title, and the declared value or price where the county publishes one. The patterns below were written
// against the real permit titles of six jurisdictions around Washington, DC, so expect to extend them for
// another region.
//
// Two things messy county data forces:
//   - A trade job is SMALL whatever value sits on it. Some counties stamp the whole project's value on
//     each trade permit (a residential gas line "worth" a house), so value only counts on building work.
//   - Some counties publish no value at all, so their permits are weighed by title alone.
export const MAJOR = 2
export const EVERYDAY = 1
export const SMALL = 0

export const BIG_PERMIT = 500000    // declared value of the work, in dollars
export const BIG_SALE = 2000000     // sale price, in dollars

// Trade and repair jobs, minor structures, and paperwork about a permit. Checked first: "Shop drawing ·
// Elevator - new" is an elevator, not a new building.
const SMALL_WORK = /electric|plumb|\bgas\b|mechanic|appliance|\bfire\b|elevator|boiler|solar|fence|\bdeck\b|\bsign\b|\bshed\b|awning|antenna|\btent\b|retaining wall|pool|post card|supplemental|shop drawing|home occupation|certificat|amendment|truss|\bfmo\b|health|sewage|\bwell\b|cross connection|damage report|code modification|miscellaneous|variance|critical structures/

// Work on the building itself. A title that fits neither list is SMALL: a kind of permit nobody has seen
// yet should arrive quietly, not as a headline.
const BUILDING_WORK = /\bnew\b|construct|\badd\b|addition|alter|restor|repair|building|ctbo|tenant|foundation|excavat|sheeting|shoring|change of use|install|demoli|\braze\b|zoning|historic|final only/

// A building going up or coming down. Washington, DC is the exception for "demolition": there the word is
// the permit for stripping an interior, and a building that comes down is a "raze".
const goesUpOrDown = (title, county) => /\bnew\b|\braze\b/.test(title) || (county !== 'DC' && /demoli/.test(title))

// A filing, in short field names because a map's data file carries thousands of them:
//   k  kind: 'permit', 'sale' or 'case' (a zoning case)
//   y  the permit's title, in the county's own words
//   v  declared value of the work, or the sale price, in dollars (missing when the county publishes none)
//   c  the jurisdiction ('DC' turns on the raze rule above)
export function weigh(e) {
  if (!e) return SMALL
  if (e.k === 'case') return MAJOR
  if (e.k === 'sale') return e.v >= BIG_SALE ? MAJOR : EVERYDAY
  const title = String(e.y || '').toLowerCase()
  if (SMALL_WORK.test(title) || !BUILDING_WORK.test(title)) return SMALL
  return goesUpOrDown(title, e.c) || e.v >= BIG_PERMIT ? MAJOR : EVERYDAY
}
