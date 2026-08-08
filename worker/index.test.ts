import { describe, expect, it } from 'vitest'
import {
  createRatingItemOrders,
  createResponseOrders,
  ratingItemOrderPresets,
  shuffle,
} from './index'

describe('study randomization', () => {
  it('returns a permutation without mutating the source array', () => {
    const source = ['S01', 'S02', 'S03', 'S04']
    const randomized = shuffle(source)

    expect(source).toEqual(['S01', 'S02', 'S03', 'S04'])
    expect(randomized).toHaveLength(source.length)
    expect([...randomized].sort()).toEqual([...source].sort())
  })

  it('creates five unique response IDs for every scenario', () => {
    const responseOrders = createResponseOrders()

    expect(Object.keys(responseOrders).sort()).toEqual([
      'S01',
      'S02',
      'S03',
      'S04',
    ])
    for (const [scenarioId, responseIds] of Object.entries(responseOrders)) {
      expect(responseIds).toHaveLength(5)
      expect(new Set(responseIds).size).toBe(5)
      expect(responseIds.every((id) => id.startsWith(`${scenarioId}-R`))).toBe(
        true,
      )
    }
  })

  it('creates one complete rating-item permutation for every response', () => {
    const ratingItemOrders = createRatingItemOrders()
    const expectedItemIds = Array.from(
      { length: 13 },
      (_, index) => `rating-item-${index + 1}`,
    )

    expect(Object.keys(ratingItemOrders)).toHaveLength(20)
    for (const [responseId, itemIds] of Object.entries(ratingItemOrders)) {
      expect(responseId).toMatch(/^S0[1-4]-R0[1-5]$/u)
      expect(itemIds).toHaveLength(expectedItemIds.length)
      expect(new Set(itemIds).size).toBe(expectedItemIds.length)
      expect([...itemIds].sort()).toEqual([...expectedItemIds].sort())
      expect(ratingItemOrderPresets).toContainEqual(itemIds)
    }
  })

  it('provides balanced presets with every item in every position once', () => {
    expect(ratingItemOrderPresets).toHaveLength(13)
    for (let position = 0; position < 13; position += 1) {
      const itemsAtPosition = ratingItemOrderPresets.map(
        (preset) => preset[position],
      )
      expect(new Set(itemsAtPosition)).toEqual(
        new Set(Array.from({ length: 13 }, (_, index) => `rating-item-${index + 1}`)),
      )
    }
  })
})
