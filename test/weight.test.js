import { test } from 'node:test'
import assert from 'node:assert/strict'
import { weigh, MAJOR, EVERYDAY, SMALL } from '../index.js'

test('every zoning case is major', () => {
  assert.equal(weigh({ k: 'case', y: 'Special exception' }), MAJOR)
})

test('sales are major from two million, everyday below', () => {
  assert.equal(weigh({ k: 'sale', v: 2500000 }), MAJOR)
  assert.equal(weigh({ k: 'sale', v: 640000 }), EVERYDAY)
})

test('a trade job is small whatever value a county stamps on it', () => {
  assert.equal(weigh({ k: 'permit', y: 'Residential Gas', v: 380000, c: 'Loudoun' }), SMALL)
  assert.equal(weigh({ k: 'permit', y: 'Shop drawing · Elevator - new' }), SMALL)
})

test('new buildings and large building work are major', () => {
  assert.equal(weigh({ k: 'permit', y: 'New Construction', c: 'Fairfax' }), MAJOR)
  assert.equal(weigh({ k: 'permit', y: 'Commercial Alteration', v: 900000, c: 'Arlington' }), MAJOR)
  assert.equal(weigh({ k: 'permit', y: 'Residential Addition', v: 120000, c: 'Montgomery' }), EVERYDAY)
})

test('in DC a demolition permit strips an interior, a raze takes the building down', () => {
  assert.equal(weigh({ k: 'permit', y: 'Demolition', c: 'DC' }), EVERYDAY)
  assert.equal(weigh({ k: 'permit', y: 'Raze', c: 'DC' }), MAJOR)
  assert.equal(weigh({ k: 'permit', y: 'Demolition', c: 'Fairfax' }), MAJOR)
})

test('an unknown kind of permit arrives quietly', () => {
  assert.equal(weigh({ k: 'permit', y: 'Something nobody has seen yet' }), SMALL)
  assert.equal(weigh(null), SMALL)
})
