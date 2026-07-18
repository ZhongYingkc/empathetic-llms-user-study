import { describe, expect, it } from 'vitest'
import { questionnaires } from './questionnaires'

describe('REDCap questionnaire coding', () => {
  it('uses the REDCap scale ranges and expected item counts', () => {
    expect(
      questionnaires.map(({ items, scaleMin, scaleMax }) => ({
        itemCount: items.length,
        scaleMin,
        scaleMax,
      })),
    ).toEqual([
      { itemCount: 9, scaleMin: 0, scaleMax: 6 },
      { itemCount: 20, scaleMin: 0, scaleMax: 4 },
      { itemCount: 10, scaleMin: 0, scaleMax: 6 },
    ])
  })
})
