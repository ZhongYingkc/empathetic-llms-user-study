import { describe, expect, it } from 'vitest'
import { createResponseOrders, shuffle } from './index'

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
})
