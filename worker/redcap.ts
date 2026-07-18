type RedcapValue = string | number

export type RedcapRecord = Record<string, RedcapValue>

type RedcapSessionRow = {
  id: string
  study_version: string
  scenario_order_json: string
  created_at: string
  completed_at: string
}

type QuestionnaireAnswerRow = {
  session_id: string
  questionnaire_id: string
  item_id: string
  value: number
}

type ScenarioPromptRow = {
  session_id: string
  scenario_id: string
  display_position: number
  prompt: string
}

type ResponseEvaluationRow = {
  session_id: string
  scenario_id: string
  response_id: string
  scenario_display_position: number
  response_display_position: number
  content_version: number
  reason: string
}

type RatingItemRow = {
  session_id: string
  scenario_id: string
  response_id: string
  item_id: string
  value: number
}

export type RedcapDataset = {
  sessions: RedcapSessionRow[]
  questionnaireAnswers: QuestionnaireAnswerRow[]
  scenarioPrompts: ScenarioPromptRow[]
  responseEvaluations: ResponseEvaluationRow[]
  ratingItems: RatingItemRow[]
}

export type RedcapSyncEnv = {
  PROD_DB: D1Database
  REDCAP_API_URL: string
  REDCAP_API_TOKEN: string
}

const pendingJobFilter = "j.status IN ('pending', 'syncing', 'failed')"

function questionnaireField(row: QuestionnaireAnswerRow): string | null {
  const match = row.item_id.match(/-item-(\d+)$/u)
  if (!match) return null
  const number = match[1].padStart(2, '0')
  if (row.questionnaire_id === 'questionnaire-1') return `ecr_rs_${number}`
  if (row.questionnaire_id === 'questionnaire-2') return `bes_${number}`
  if (row.questionnaire_id === 'questionnaire-3') return `erq_${number}`
  return null
}

function ratingField(itemId: string): string | null {
  const match = itemId.match(/^rating-item-(\d+)$/u)
  const itemNumber = Number(match?.[1])
  if (itemNumber >= 1 && itemNumber <= 10) {
    return `pet_${String(itemNumber).padStart(2, '0')}`
  }
  if (itemNumber === 11) return 'satisfaction'
  if (itemNumber === 12) return 'comfortable'
  if (itemNumber === 13) return 'willingness'
  return null
}

export function buildRedcapRecords(dataset: RedcapDataset): RedcapRecord[] {
  const records: RedcapRecord[] = []

  for (const session of dataset.sessions) {
    const baseRecord: RedcapRecord = {
      record_id: session.id,
      session_start: session.created_at,
      completed_at: session.completed_at,
      study_version: session.study_version,
      condition_order: (JSON.parse(session.scenario_order_json) as string[]).join(','),
      form_1_complete: 2,
      prestudy_questionnaire_complete: 2,
    }

    for (const answer of dataset.questionnaireAnswers) {
      if (answer.session_id !== session.id) continue
      const field = questionnaireField(answer)
      if (field) baseRecord[field] = answer.value
    }
    records.push(baseRecord)

    const prompts = dataset.scenarioPrompts
      .filter((prompt) => prompt.session_id === session.id)
      .sort((left, right) => left.display_position - right.display_position)
    for (const prompt of prompts) {
      records.push({
        record_id: session.id,
        redcap_repeat_instrument: 'scenario_entry',
        redcap_repeat_instance: prompt.display_position,
        scenario_id: prompt.scenario_id,
        scenario_order: prompt.display_position,
        prompt_for_scenario: prompt.prompt,
        scenario_entry_complete: 2,
      })
    }

    const evaluations = dataset.responseEvaluations
      .filter((evaluation) => evaluation.session_id === session.id)
      .sort(
        (left, right) =>
          left.scenario_display_position - right.scenario_display_position ||
          left.response_display_position - right.response_display_position,
      )
    for (const evaluation of evaluations) {
      const trialRecord: RedcapRecord = {
        record_id: session.id,
        redcap_repeat_instrument: 'scenario_trial',
        redcap_repeat_instance:
          (evaluation.scenario_display_position - 1) * 5 +
          evaluation.response_display_position,
        scenario_order_r: evaluation.scenario_display_position,
        scenario_id_r: evaluation.scenario_id,
        answer_order: evaluation.response_display_position,
        answer_id: evaluation.response_id,
        content_version: evaluation.content_version,
        reason: evaluation.reason,
        scenario_trial_complete: 2,
      }
      for (const rating of dataset.ratingItems) {
        if (
          rating.session_id !== session.id ||
          rating.scenario_id !== evaluation.scenario_id ||
          rating.response_id !== evaluation.response_id
        ) {
          continue
        }
        const field = ratingField(rating.item_id)
        if (field) trialRecord[field] = rating.value
      }
      records.push(trialRecord)
    }
  }

  return records
}

export function isElevenPmEastern(timestamp: number): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Indiana/Indianapolis',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp))
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value
  return value('hour') === '23' && value('minute') === '00'
}

async function loadPendingDataset(database: D1Database): Promise<RedcapDataset> {
  const [sessions, questionnaireAnswers, scenarioPrompts, responseEvaluations, ratingItems] =
    await Promise.all([
      database
        .prepare(
          `SELECT s.id, s.study_version, s.scenario_order_json,
                  s.created_at, s.completed_at
           FROM study_sessions s
           JOIN redcap_sync_jobs j ON j.session_id = s.id
           WHERE ${pendingJobFilter}
             AND s.status = 'completed'
             AND s.access_mode = 'participant'
           ORDER BY s.completed_at, s.id`,
        )
        .all<RedcapSessionRow>(),
      database
        .prepare(
          `SELECT q.session_id, q.questionnaire_id, q.item_id, q.value
           FROM questionnaire_answers q
           JOIN redcap_sync_jobs j ON j.session_id = q.session_id
           WHERE ${pendingJobFilter}
           ORDER BY q.session_id, q.questionnaire_id, q.item_id`,
        )
        .all<QuestionnaireAnswerRow>(),
      database
        .prepare(
          `SELECT p.session_id, p.scenario_id, p.display_position, p.prompt
           FROM scenario_prompts p
           JOIN redcap_sync_jobs j ON j.session_id = p.session_id
           WHERE ${pendingJobFilter}
           ORDER BY p.session_id, p.display_position`,
        )
        .all<ScenarioPromptRow>(),
      database
        .prepare(
          `SELECT e.session_id, e.scenario_id, e.response_id,
                  e.scenario_display_position, e.response_display_position,
                  e.content_version, e.reason
           FROM response_evaluations e
           JOIN redcap_sync_jobs j ON j.session_id = e.session_id
           WHERE ${pendingJobFilter}
           ORDER BY e.session_id, e.scenario_display_position,
                    e.response_display_position`,
        )
        .all<ResponseEvaluationRow>(),
      database
        .prepare(
          `SELECT r.session_id, r.scenario_id, r.response_id, r.item_id, r.value
           FROM response_rating_items r
           JOIN redcap_sync_jobs j ON j.session_id = r.session_id
           WHERE ${pendingJobFilter}
           ORDER BY r.session_id, r.scenario_id, r.response_id, r.item_id`,
        )
        .all<RatingItemRow>(),
    ])

  return {
    sessions: sessions.results,
    questionnaireAnswers: questionnaireAnswers.results,
    scenarioPrompts: scenarioPrompts.results,
    responseEvaluations: responseEvaluations.results,
    ratingItems: ratingItems.results,
  }
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown REDCap sync error'
  return message.replaceAll(/token=[^&\s]+/giu, 'token=[redacted]').slice(0, 1000)
}

function assertCompleteDataset(dataset: RedcapDataset): void {
  for (const session of dataset.sessions) {
    const belongsToSession = (row: { session_id: string }) =>
      row.session_id === session.id
    const answerCount = dataset.questionnaireAnswers.filter(belongsToSession).length
    const promptCount = dataset.scenarioPrompts.filter(belongsToSession).length
    const evaluationCount = dataset.responseEvaluations.filter(belongsToSession).length
    const ratingCount = dataset.ratingItems.filter(belongsToSession).length
    if (
      answerCount !== 39 ||
      promptCount !== 4 ||
      evaluationCount !== 20 ||
      ratingCount !== 260
    ) {
      throw new Error(`Session ${session.id} has an incomplete REDCap dataset.`)
    }
  }
}

export async function syncPendingSessionsToRedcap(
  env: RedcapSyncEnv,
): Promise<number> {
  const dataset = await loadPendingDataset(env.PROD_DB)
  if (dataset.sessions.length === 0) return 0

  const now = new Date().toISOString()
  const sessionIds = dataset.sessions.map((session) => session.id)
  await env.PROD_DB.batch(
    sessionIds.map((sessionId) =>
      env.PROD_DB
        .prepare(
          `UPDATE redcap_sync_jobs
           SET status = 'syncing', attempt_count = attempt_count + 1,
               last_attempt_at = ?, updated_at = ?, last_error = NULL
           WHERE session_id = ?`,
        )
        .bind(now, now, sessionId),
    ),
  )

  try {
    if (!env.REDCAP_API_URL || !env.REDCAP_API_TOKEN) {
      throw new Error('REDCap API configuration is missing.')
    }
    assertCompleteDataset(dataset)
    const records = buildRedcapRecords(dataset)
    const body = new URLSearchParams({
      token: env.REDCAP_API_TOKEN,
      content: 'record',
      action: 'import',
      format: 'json',
      type: 'flat',
      overwriteBehavior: 'normal',
      forceAutoNumber: 'false',
      data: JSON.stringify(records),
      returnContent: 'count',
      returnFormat: 'json',
    })
    const response = await fetch(env.REDCAP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const responseText = await response.text()
    if (!response.ok) {
      throw new Error(`REDCap returned HTTP ${response.status}: ${responseText}`)
    }
    const parsed = JSON.parse(responseText) as { count?: number }
    if (!Number.isFinite(parsed.count) || Number(parsed.count) < 1) {
      throw new Error(`REDCap returned an unexpected response: ${responseText}`)
    }

    const syncedAt = new Date().toISOString()
    await env.PROD_DB.batch(
      sessionIds.map((sessionId) =>
        env.PROD_DB
          .prepare(
            `UPDATE redcap_sync_jobs
             SET status = 'synced', synced_at = ?, updated_at = ?, last_error = NULL
             WHERE session_id = ?`,
          )
          .bind(syncedAt, syncedAt, sessionId),
      ),
    )
    return sessionIds.length
  } catch (error) {
    const failedAt = new Date().toISOString()
    const errorMessage = safeError(error)
    await env.PROD_DB.batch(
      sessionIds.map((sessionId) =>
        env.PROD_DB
          .prepare(
            `UPDATE redcap_sync_jobs
             SET status = 'failed', updated_at = ?, last_error = ?
             WHERE session_id = ?`,
          )
          .bind(failedAt, errorMessage, sessionId),
      ),
    )
    throw error
  }
}
