import { describe, expect, it } from 'vitest'
import { scenarios } from './scenarios'

describe('scenario content identifiers', () => {
  it('provides four stable scenario IDs and five stable response IDs each', () => {
    expect(scenarios).toHaveLength(4)
    expect(new Set(scenarios.map(({ id }) => id)).size).toBe(4)

    for (const scenario of scenarios) {
      expect(scenario.possibleResponses).toHaveLength(5)
      expect(
        new Set(scenario.possibleResponses.map(({ id }) => id)).size,
      ).toBe(5)
      expect(
        scenario.possibleResponses.every(({ id }) =>
          id.startsWith(`${scenario.id}-R`),
        ),
      ).toBe(true)
    }
  })
})
