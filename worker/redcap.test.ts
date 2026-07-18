import { describe, expect, it } from 'vitest'
import { buildRedcapRecords, isElevenPmEastern } from './redcap'

describe('REDCap nightly schedule', () => {
  it('recognizes 11 PM Eastern during daylight and standard time', () => {
    expect(isElevenPmEastern(Date.parse('2026-07-19T03:00:00Z'))).toBe(true)
    expect(isElevenPmEastern(Date.parse('2026-01-19T04:00:00Z'))).toBe(true)
    expect(isElevenPmEastern(Date.parse('2026-07-19T04:00:00Z'))).toBe(false)
    expect(isElevenPmEastern(Date.parse('2026-01-19T03:00:00Z'))).toBe(false)
  })
})

describe('REDCap record mapping', () => {
  it('maps questionnaire, scenario, and rating data to repeating instruments', () => {
    const records = buildRedcapRecords({
      sessions: [
        {
          id: 'session-1',
          study_version: '2026-07-18',
          scenario_order_json: '["S03","S01","S04","S02"]',
          created_at: '2026-07-18T18:00:00.000Z',
          completed_at: '2026-07-18T19:00:00.000Z',
        },
      ],
      questionnaireAnswers: [
        {
          session_id: 'session-1',
          questionnaire_id: 'questionnaire-1',
          item_id: 'questionnaire-1-item-1',
          value: 6,
        },
        {
          session_id: 'session-1',
          questionnaire_id: 'questionnaire-2',
          item_id: 'questionnaire-2-item-20',
          value: 4,
        },
        {
          session_id: 'session-1',
          questionnaire_id: 'questionnaire-3',
          item_id: 'questionnaire-3-item-10',
          value: 0,
        },
      ],
      scenarioPrompts: [
        {
          session_id: 'session-1',
          scenario_id: 'S03',
          display_position: 1,
          prompt: 'A participant prompt',
        },
      ],
      responseEvaluations: [
        {
          session_id: 'session-1',
          scenario_id: 'S03',
          response_id: 'S03-R04',
          scenario_display_position: 1,
          response_display_position: 2,
          content_version: 1,
          reason: 'A rating reason',
        },
      ],
      ratingItems: [
        {
          session_id: 'session-1',
          scenario_id: 'S03',
          response_id: 'S03-R04',
          item_id: 'rating-item-1',
          value: 10,
        },
        {
          session_id: 'session-1',
          scenario_id: 'S03',
          response_id: 'S03-R04',
          item_id: 'rating-item-11',
          value: 91,
        },
        {
          session_id: 'session-1',
          scenario_id: 'S03',
          response_id: 'S03-R04',
          item_id: 'rating-item-12',
          value: 92,
        },
        {
          session_id: 'session-1',
          scenario_id: 'S03',
          response_id: 'S03-R04',
          item_id: 'rating-item-13',
          value: 93,
        },
      ],
    })

    expect(records).toHaveLength(3)
    expect(records[0]).toMatchObject({
      record_id: 'session-1',
      condition_order: 'S03,S01,S04,S02',
      ecr_rs_01: 6,
      bes_20: 4,
      erq_10: 0,
    })
    expect(records[1]).toMatchObject({
      redcap_repeat_instrument: 'scenario_entry',
      redcap_repeat_instance: 1,
      scenario_id: 'S03',
      scenario_order: 1,
    })
    expect(records[2]).toMatchObject({
      redcap_repeat_instrument: 'scenario_trial',
      redcap_repeat_instance: 2,
      scenario_order_r: 1,
      answer_order: 2,
      answer_id: 'S03-R04',
      pet_01: 10,
      satisfaction: 91,
      comfortable: 92,
      willingness: 93,
    })
  })
})
