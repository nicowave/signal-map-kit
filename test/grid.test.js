import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupByArea, SMALL, MAJOR, DEFAULTS } from '../index.js'

// A tight bunch of points in one place, plus one lone point far away
const bunch = Array.from({ length: 20 }, (_, i) => ({ id: `b${i}`, p: [-77.03 + i * 0.0001, 38.9 + i * 0.0001], w: SMALL }))
const lone = { id: 'lone', p: [-78.5, 39.4], w: SMALL }

test('a busy place becomes one square at every zoom below split', () => {
  const { areas } = groupByArea([...bunch, lone])
  const squares = areas.features.filter(f => f.geometry.type === 'Polygon')
  assert.equal(squares.length, DEFAULTS.split - DEFAULTS.from)
  for (const s of squares) assert.equal(s.properties.n, 20)
  // each square comes with one Point for its number
  assert.equal(areas.features.length, squares.length * 2)
})

test('points in a square become single marks at split, a lone point is a mark from the start', () => {
  const { from } = groupByArea([...bunch, lone])
  assert.equal(from('b0'), DEFAULTS.split)
  assert.equal(from('lone'), DEFAULTS.from)
})

test('a square is the same piece of ground at every run', () => {
  const a = groupByArea(bunch).areas.features[0].geometry.coordinates
  const b = groupByArea([...bunch].reverse()).areas.features[0].geometry.coordinates
  assert.deepEqual(a, b)
})

test('fewer than min points stay marks', () => {
  const { areas } = groupByArea(bunch.slice(0, DEFAULTS.min - 1))
  assert.equal(areas.features.length, 0)
})

test('with only major points showing, nothing is counted', () => {
  const { areas } = groupByArea(bunch.map(e => ({ ...e, w: MAJOR })))
  assert.equal(areas.features.length, 0)
})

test('options change the grid', () => {
  const { areas } = groupByArea(bunch, { from: 5, split: 6, min: 2 })
  assert.equal(areas.features.filter(f => f.geometry.type === 'Polygon').length, 1)
  assert.equal(areas.features[0].properties.lvl, 5)
})
