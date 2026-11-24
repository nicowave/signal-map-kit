# signal-map-kit

Two small, dependency-free modules from [DMV Signal](https://nico-tek.com/dmv-signal), a live map of building permits, zoning cases and property sales around Washington, DC.

- **`weigh`** sorts a public filing into **major**, **everyday** or **small**, so a map can size its marks and the few filings that matter stand out from the trade jobs.
- **`groupByArea`** counts busy places in **fixed squares that split into four as you zoom in**, then into single marks. A square is always the same piece of ground: it never drifts or re-forms the way floating clusters do.

The story of why they exist, with drawings: [How I built DMV Signal](https://nico-tek.com/open-forum/dmv-signal).

## Use it

Node 18 or later, or any modern browser. No install step beyond copying the files or adding the repository:

```bash
npm install github:nicowave/signal-map-kit
```

```js
import { weigh, groupByArea } from 'signal-map-kit'

// One entry per filing: an id, a [longitude, latitude] point and a weight
const events = filings.map((f) => ({ id: f.id, p: [f.lng, f.lat], w: weigh(f) }))

const { areas, from } = groupByArea(events)
// areas: GeoJSON squares (Polygons) and the spots where their numbers go (Points)
// from(id): the zoom from which that filing is drawn as its own mark
```

### The fields `weigh` reads

| Field | Meaning |
| --- | --- |
| `k` | `'permit'`, `'sale'` or `'case'` (a zoning case) |
| `y` | the permit's title, in the county's own words |
| `v` | declared value of the work, or the sale price, in dollars; leave it out when the county publishes none |
| `c` | the jurisdiction; `'DC'` switches on its rule that a "raze", not a "demolition", takes a building down |

The title patterns were written against six jurisdictions around Washington, DC. Expect to extend them for another region.

### Drawing it in MapLibre

Each square carries `lvl`, the zoom it was counted for. Show it at that zoom only, and show a point as a mark when it is major or once no square counts it:

```js
const features = events.map((e) => ({
  type: 'Feature',
  properties: { id: e.id, w: e.w, u: from(e.id) },
  geometry: { type: 'Point', coordinates: e.p },
}))
map.addSource('filings', { type: 'geojson', data: { type: 'FeatureCollection', features } })
map.addSource('areas', { type: 'geojson', data: areas })

const AT_ITS_ZOOM = ['==', ['get', 'lvl'], ['zoom']]   // in a filter, zoom is the whole tile level
map.addLayer({ id: 'squares', type: 'fill', source: 'areas', maxzoom: 10, filter: AT_ITS_ZOOM,
  paint: { 'fill-color': '#1c2a3e', 'fill-opacity': ['+', 0.035, ['*', 0.13, ['get', 't']]] } })
map.addLayer({ id: 'counts', type: 'symbol', source: 'areas', maxzoom: 10,
  filter: ['all', ['==', ['geometry-type'], 'Point'], AT_ITS_ZOOM],
  layout: { 'text-field': ['get', 'label'], 'text-anchor': 'top-left', 'text-size': ['+', 11, ['*', 5, ['get', 't']]] } })
map.addLayer({ id: 'marks', type: 'circle', source: 'filings',
  filter: ['any', ['==', ['get', 'w'], 2], ['>=', ['zoom'], ['get', 'u']]],
  paint: { 'circle-radius': ['match', ['get', 'w'], 2, 9, 1, 5, 2.5] } })
```

### Settings

`groupByArea(events, options)` takes any of these:

| Option | Default | What it does |
| --- | --- | --- |
| `from` | 7 | the map's lowest zoom |
| `split` | 10 | the zoom from which every point is its own mark (use it as the layers' `maxzoom`) |
| `depth` | 3 | how much finer than a map tile a square is: 3 means one eighth on each side, 64 to 128 pixels on screen |
| `min` | 8 | fewer points than this in a square stay single marks |
| `gap` | 0.012 | how far short of its edge a square is drawn, so neighbours do not fuse |
| `corner` | 0.07 | where the number sits, inside the top left corner like the day in a calendar box |

## Try it

```bash
npm test
npm run example
```

## Shared as is

This is working code from a live map, shared so others can read and reuse it. It comes with no promise of support. Questions and better ideas are welcome in the [Open Forum discussions](https://github.com/nicowave/open-forum/discussions).

## Licence

MIT. Use, change or sell it; keep the copyright and licence notice. See [LICENSE](LICENSE).
