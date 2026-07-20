import { z } from 'zod'
import {
  isElevenPmEastern,
  syncPendingSessionsToRedcap,
} from './redcap'

type AccessMode = 'participant' | 'researcher'

interface Env {
  PROD_DB: D1Database
  TEST_DB: D1Database
  TURNSTILE_SECRET_KEY: string
  PARTICIPANT_ACCESS_CODE: string
  RESEARCHER_ACCESS_CODE: string
  SESSION_SIGNING_SECRET: string
  REDCAP_API_URL: string
  REDCAP_API_TOKEN: string
}

type SessionTokenPayload = {
  sessionId: string
  accessMode: AccessMode
  expiresAt: number
}

type SessionRow = {
  id: string
  access_mode: AccessMode
  status: 'in_progress' | 'completed'
  scenario_order_json: string
  response_orders_json: string
}

type ResponseOrders = Record<string, string[]>

const allowedOrigins = new Set([
  'https://zhongyingkc.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

const productionHostname = 'zhongyingkc.github.io'
const studyVersion = '2026-07-19'
const scenarioIds = ['S01', 'S02', 'S03', 'S04'] as const
const questionnaireRules = {
  'questionnaire-1': { itemCount: 9, min: 0, max: 6 },
  'questionnaire-2': { itemCount: 20, min: 0, max: 4 },
  'questionnaire-3': { itemCount: 10, min: 0, max: 6 },
} as const
const ratingItemIds = Array.from(
  { length: 13 },
  (_, index) => `rating-item-${index + 1}`,
)

const startSessionSchema = z.object({
  accessCode: z.string().trim().min(1).max(64),
  turnstileToken: z.string().min(1).max(2048),
})

const questionnaireSchema = z.object({
  answers: z.record(z.string(), z.number().int()),
})

const scenarioPromptSchema = z.object({
  displayPosition: z.number().int().min(1).max(4),
  prompt: z.string().max(5000),
})

const responseRatingSchema = z.object({
  scenarioDisplayPosition: z.number().int().min(1).max(4),
  responseDisplayPosition: z.number().int().min(1).max(5),
  contentVersion: z.number().int().min(1),
  ratings: z.record(z.string(), z.number().int().min(0).max(100)),
  reason: z.string().max(5000),
})

function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') ?? ''
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin)
      ? origin
      : 'https://zhongyingkc.github.io',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'DELETE, GET, POST, PUT, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(
  request: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request),
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function getDatabase(env: Env, accessMode: AccessMode): D1Database {
  return accessMode === 'researcher' ? env.TEST_DB : env.PROD_DB
}

export function shuffle<T>(values: readonly T[]): T[] {
  const shuffled = [...values]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
    const swapIndex = Math.floor(random * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ]
  }
  return shuffled
}

export function createResponseOrders(): ResponseOrders {
  return Object.fromEntries(
    scenarioIds.map((scenarioId) => [
      scenarioId,
      shuffle(
        Array.from(
          { length: 5 },
          (_, index) => `${scenarioId}-R${String(index + 1).padStart(2, '0')}`,
        ),
      ),
    ]),
  )
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

function textToBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value))
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function createSessionToken(
  env: Env,
  payload: SessionTokenPayload,
): Promise<string> {
  const encodedPayload = textToBase64Url(JSON.stringify(payload))
  const signature = await crypto.subtle.sign(
    'HMAC',
    await importSigningKey(env.SESSION_SIGNING_SECRET),
    new TextEncoder().encode(encodedPayload),
  )
  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`
}

async function verifySessionToken(
  request: Request,
  env: Env,
): Promise<SessionTokenPayload | null> {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice('Bearer '.length)
  const [encodedPayload, encodedSignature] = token.split('.')
  if (!encodedPayload || !encodedSignature) return null

  try {
    const isValid = await crypto.subtle.verify(
      'HMAC',
      await importSigningKey(env.SESSION_SIGNING_SECRET),
      base64UrlToBytes(encodedSignature).buffer as ArrayBuffer,
      new TextEncoder().encode(encodedPayload),
    )
    if (!isValid) return null

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encodedPayload)),
    ) as SessionTokenPayload
    if (
      !payload.sessionId ||
      !['participant', 'researcher'].includes(payload.accessMode) ||
      payload.expiresAt <= Date.now()
    ) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

async function verifyTurnstile(
  env: Env,
  token: string,
): Promise<boolean> {
  const formData = new FormData()
  formData.set('secret', env.TURNSTILE_SECRET_KEY)
  formData.set('response', token)
  formData.set('idempotency_key', crypto.randomUUID())

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: formData },
  )
  if (!response.ok) return false
  const result = (await response.json()) as {
    success?: boolean
    hostname?: string
  }
  return Boolean(
    result.success &&
      (result.hostname === productionHostname ||
        result.hostname === 'localhost' ||
        result.hostname === '127.0.0.1'),
  )
}

async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get('Content-Type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error('Expected application/json')
  }
  return request.json()
}

async function getSession(
  database: D1Database,
  sessionId: string,
): Promise<SessionRow | null> {
  return database
    .prepare(
      `SELECT id, access_mode, status, scenario_order_json, response_orders_json
       FROM study_sessions WHERE id = ?`,
    )
    .bind(sessionId)
    .first<SessionRow>()
}

async function authenticateSession(
  request: Request,
  env: Env,
  sessionId: string,
): Promise<
  | { payload: SessionTokenPayload; database: D1Database; session: SessionRow }
  | null
> {
  const payload = await verifySessionToken(request, env)
  if (!payload || payload.sessionId !== sessionId) return null
  const database = getDatabase(env, payload.accessMode)
  const session = await getSession(database, sessionId)
  if (!session || session.access_mode !== payload.accessMode) return null
  return { payload, database, session }
}

function validateQuestionnaireAnswers(
  questionnaireId: keyof typeof questionnaireRules,
  answers: Record<string, number>,
  accessMode: AccessMode,
): boolean {
  const rule = questionnaireRules[questionnaireId]
  const expectedIds = Array.from(
    { length: rule.itemCount },
    (_, index) => `${questionnaireId}-item-${index + 1}`,
  )
  const entries = Object.entries(answers)
  if (accessMode === 'participant' && entries.length !== rule.itemCount) {
    return false
  }
  return entries.every(
    ([itemId, value]) =>
      expectedIds.includes(itemId) && value >= rule.min && value <= rule.max,
  )
}

function validateRatingItems(
  ratings: Record<string, number>,
  accessMode: AccessMode,
): boolean {
  const entries = Object.entries(ratings)
  if (accessMode === 'participant' && entries.length !== ratingItemIds.length) {
    return false
  }
  return entries.every(
    ([itemId, value]) =>
      ratingItemIds.includes(itemId) && value >= 0 && value <= 100,
  )
}

async function handleStartSession(request: Request, env: Env): Promise<Response> {
  const parsed = startSessionSchema.safeParse(await readJson(request))
  if (!parsed.success) return json(request, { error: 'Invalid request.' }, 400)
  if (!(await verifyTurnstile(env, parsed.data.turnstileToken))) {
    return json(request, { error: 'Verification failed. Please try again.' }, 400)
  }

  const normalizedCode = parsed.data.accessCode.toUpperCase()
  const accessMode: AccessMode | null =
    normalizedCode === env.PARTICIPANT_ACCESS_CODE.toUpperCase()
      ? 'participant'
      : normalizedCode === env.RESEARCHER_ACCESS_CODE.toUpperCase()
        ? 'researcher'
        : null
  if (!accessMode) return json(request, { error: 'Invalid access code.' }, 401)

  const sessionId = crypto.randomUUID()
  const scenarioOrder = shuffle(scenarioIds)
  const responseOrders = createResponseOrders()
  const now = new Date().toISOString()
  const database = getDatabase(env, accessMode)
  await database
    .prepare(
      `INSERT INTO study_sessions (
        id, access_mode, status, study_version, scenario_order_json,
        response_orders_json, created_at, updated_at
      ) VALUES (?, ?, 'in_progress', ?, ?, ?, ?, ?)`,
    )
    .bind(
      sessionId,
      accessMode,
      studyVersion,
      JSON.stringify(scenarioOrder),
      JSON.stringify(responseOrders),
      now,
      now,
    )
    .run()

  const sessionToken = await createSessionToken(env, {
    sessionId,
    accessMode,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
  })
  return json(request, {
    sessionId,
    sessionToken,
    accessMode,
    studyVersion,
    scenarioOrder,
    responseOrders,
  }, 201)
}

async function handleQuestionnaire(
  request: Request,
  env: Env,
  sessionId: string,
  questionnaireId: string,
): Promise<Response> {
  if (!(questionnaireId in questionnaireRules)) {
    return json(request, { error: 'Unknown questionnaire.' }, 404)
  }
  const authenticated = await authenticateSession(request, env, sessionId)
  if (!authenticated) return json(request, { error: 'Unauthorized.' }, 401)
  if (authenticated.session.status === 'completed') {
    return json(request, { error: 'Study is already completed.' }, 409)
  }
  const parsed = questionnaireSchema.safeParse(await readJson(request))
  if (!parsed.success) return json(request, { error: 'Invalid answers.' }, 400)
  const typedQuestionnaireId = questionnaireId as keyof typeof questionnaireRules
  if (
    !validateQuestionnaireAnswers(
      typedQuestionnaireId,
      parsed.data.answers,
      authenticated.payload.accessMode,
    )
  ) {
    return json(request, { error: 'Please answer every questionnaire item.' }, 400)
  }

  const now = new Date().toISOString()
  const statements = [
    authenticated.database
      .prepare(
        'DELETE FROM questionnaire_answers WHERE session_id = ? AND questionnaire_id = ?',
      )
      .bind(sessionId, questionnaireId),
    ...Object.entries(parsed.data.answers).map(([itemId, value]) =>
      authenticated.database
        .prepare(
          `INSERT INTO questionnaire_answers
           (session_id, questionnaire_id, item_id, value, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(sessionId, questionnaireId, itemId, value, now),
    ),
    authenticated.database
      .prepare('UPDATE study_sessions SET updated_at = ? WHERE id = ?')
      .bind(now, sessionId),
  ]
  await authenticated.database.batch(statements)
  return json(request, { saved: true })
}

async function handleScenarioPrompt(
  request: Request,
  env: Env,
  sessionId: string,
  scenarioId: string,
): Promise<Response> {
  const authenticated = await authenticateSession(request, env, sessionId)
  if (!authenticated) return json(request, { error: 'Unauthorized.' }, 401)
  if (authenticated.session.status === 'completed') {
    return json(request, { error: 'Study is already completed.' }, 409)
  }
  const parsed = scenarioPromptSchema.safeParse(await readJson(request))
  if (!parsed.success) return json(request, { error: 'Invalid prompt.' }, 400)

  const scenarioOrder = JSON.parse(
    authenticated.session.scenario_order_json,
  ) as string[]
  if (
    scenarioOrder[parsed.data.displayPosition - 1] !== scenarioId ||
    (authenticated.payload.accessMode === 'participant' &&
      !parsed.data.prompt.trim())
  ) {
    return json(request, { error: 'A prompt is required.' }, 400)
  }

  const now = new Date().toISOString()
  await authenticated.database.batch([
    authenticated.database
      .prepare(
        `INSERT INTO scenario_prompts
         (session_id, scenario_id, display_position, prompt, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(session_id, scenario_id) DO UPDATE SET
           display_position = excluded.display_position,
           prompt = excluded.prompt,
           updated_at = excluded.updated_at`,
      )
      .bind(
        sessionId,
        scenarioId,
        parsed.data.displayPosition,
        parsed.data.prompt.trim(),
        now,
      ),
    authenticated.database
      .prepare('UPDATE study_sessions SET updated_at = ? WHERE id = ?')
      .bind(now, sessionId),
  ])
  return json(request, { saved: true })
}

async function handleResponseRating(
  request: Request,
  env: Env,
  sessionId: string,
  scenarioId: string,
  responseId: string,
): Promise<Response> {
  const authenticated = await authenticateSession(request, env, sessionId)
  if (!authenticated) return json(request, { error: 'Unauthorized.' }, 401)
  if (authenticated.session.status === 'completed') {
    return json(request, { error: 'Study is already completed.' }, 409)
  }
  const parsed = responseRatingSchema.safeParse(await readJson(request))
  if (!parsed.success) return json(request, { error: 'Invalid ratings.' }, 400)

  const scenarioOrder = JSON.parse(
    authenticated.session.scenario_order_json,
  ) as string[]
  const responseOrders = JSON.parse(
    authenticated.session.response_orders_json,
  ) as ResponseOrders
  if (
    scenarioOrder[parsed.data.scenarioDisplayPosition - 1] !== scenarioId ||
    responseOrders[scenarioId]?.[parsed.data.responseDisplayPosition - 1] !==
      responseId ||
    !validateRatingItems(
      parsed.data.ratings,
      authenticated.payload.accessMode,
    ) ||
    (authenticated.payload.accessMode === 'participant' &&
      !parsed.data.reason.trim())
  ) {
    return json(request, { error: 'Please complete every rating and reason.' }, 400)
  }

  const now = new Date().toISOString()
  const statements = [
    authenticated.database
      .prepare(
        `INSERT INTO response_evaluations (
          session_id, scenario_id, response_id, scenario_display_position,
          response_display_position, content_version, reason, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, scenario_id, response_id) DO UPDATE SET
          scenario_display_position = excluded.scenario_display_position,
          response_display_position = excluded.response_display_position,
          content_version = excluded.content_version,
          reason = excluded.reason,
          updated_at = excluded.updated_at`,
      )
      .bind(
        sessionId,
        scenarioId,
        responseId,
        parsed.data.scenarioDisplayPosition,
        parsed.data.responseDisplayPosition,
        parsed.data.contentVersion,
        parsed.data.reason.trim(),
        now,
      ),
    authenticated.database
      .prepare(
        `DELETE FROM response_rating_items
         WHERE session_id = ? AND scenario_id = ? AND response_id = ?`,
      )
      .bind(sessionId, scenarioId, responseId),
    ...Object.entries(parsed.data.ratings).map(([itemId, value]) =>
      authenticated.database
        .prepare(
          `INSERT INTO response_rating_items
           (session_id, scenario_id, response_id, item_id, value, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(sessionId, scenarioId, responseId, itemId, value, now),
    ),
    authenticated.database
      .prepare('UPDATE study_sessions SET updated_at = ? WHERE id = ?')
      .bind(now, sessionId),
  ]
  await authenticated.database.batch(statements)
  return json(request, { saved: true })
}

async function handleCompleteStudy(
  request: Request,
  env: Env,
  sessionId: string,
): Promise<Response> {
  const authenticated = await authenticateSession(request, env, sessionId)
  if (!authenticated) return json(request, { error: 'Unauthorized.' }, 401)

  if (authenticated.session.status === 'completed') {
    return json(request, { completed: true })
  }

  if (authenticated.payload.accessMode === 'participant') {
    const [questionnaires, prompts, evaluations, ratingItems] =
      await authenticated.database.batch([
        authenticated.database
          .prepare(
            `SELECT COUNT(*) AS count FROM questionnaire_answers
             WHERE session_id = ?`,
          )
          .bind(sessionId),
        authenticated.database
          .prepare(
            `SELECT COUNT(*) AS count FROM scenario_prompts
             WHERE session_id = ? AND length(trim(prompt)) > 0`,
          )
          .bind(sessionId),
        authenticated.database
          .prepare(
            `SELECT COUNT(*) AS count FROM response_evaluations
             WHERE session_id = ? AND length(trim(reason)) > 0`,
          )
          .bind(sessionId),
        authenticated.database
          .prepare(
            `SELECT COUNT(*) AS count FROM response_rating_items
             WHERE session_id = ?`,
          )
          .bind(sessionId),
      ])
    const count = (result: D1Result<unknown>) =>
      Number((result.results[0] as { count?: number } | undefined)?.count ?? 0)
    if (
      count(questionnaires) !== 39 ||
      count(prompts) !== 4 ||
      count(evaluations) !== 20 ||
      count(ratingItems) !== 260
    ) {
      return json(request, { error: 'The study is not complete.' }, 409)
    }
  }

  const now = new Date().toISOString()
  const completeSession = authenticated.database
    .prepare(
      `UPDATE study_sessions
       SET status = 'completed', completed_at = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(now, now, sessionId)
  if (authenticated.payload.accessMode === 'participant') {
    await authenticated.database.batch([
      completeSession,
      authenticated.database
        .prepare(
          `INSERT INTO redcap_sync_jobs
           (session_id, status, attempt_count, created_at, updated_at)
           VALUES (?, 'pending', 0, ?, ?)
           ON CONFLICT(session_id) DO NOTHING`,
        )
        .bind(sessionId, now, now),
    ])
  } else {
    await completeSession.run()
  }
  return json(request, { completed: true })
}

async function handleAbandonStudy(
  request: Request,
  env: Env,
  sessionId: string,
): Promise<Response> {
  const authenticated = await authenticateSession(request, env, sessionId)
  if (!authenticated) return json(request, { error: 'Unauthorized.' }, 401)
  if (authenticated.session.status === 'completed') {
    return json(request, { error: 'Completed studies cannot be deleted.' }, 409)
  }

  await authenticated.database.batch([
    authenticated.database
      .prepare('DELETE FROM response_rating_items WHERE session_id = ?')
      .bind(sessionId),
    authenticated.database
      .prepare('DELETE FROM response_evaluations WHERE session_id = ?')
      .bind(sessionId),
    authenticated.database
      .prepare('DELETE FROM scenario_prompts WHERE session_id = ?')
      .bind(sessionId),
    authenticated.database
      .prepare('DELETE FROM questionnaire_answers WHERE session_id = ?')
      .bind(sessionId),
    authenticated.database
      .prepare('DELETE FROM study_sessions WHERE id = ?')
      .bind(sessionId),
  ])
  return json(request, { abandoned: true })
}

async function routeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const contentLength = Number(request.headers.get('Content-Length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > 100_000) {
    return json(request, { error: 'Request is too large.' }, 413)
  }
  if (!allowedOrigins.has(request.headers.get('Origin') ?? '') && request.method !== 'GET') {
    return json(request, { error: 'Origin not allowed.' }, 403)
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request) })
  }
  if (request.method === 'GET' && url.pathname === '/api/health') {
    return json(request, { ok: true })
  }
  if (request.method === 'POST' && url.pathname === '/api/session') {
    return handleStartSession(request, env)
  }

  const questionnaireMatch = url.pathname.match(
    /^\/api\/sessions\/([^/]+)\/questionnaires\/([^/]+)$/u,
  )
  if (request.method === 'PUT' && questionnaireMatch) {
    return handleQuestionnaire(
      request,
      env,
      questionnaireMatch[1],
      questionnaireMatch[2],
    )
  }

  const promptMatch = url.pathname.match(
    /^\/api\/sessions\/([^/]+)\/scenarios\/([^/]+)\/prompt$/u,
  )
  if (request.method === 'PUT' && promptMatch) {
    return handleScenarioPrompt(request, env, promptMatch[1], promptMatch[2])
  }

  const ratingMatch = url.pathname.match(
    /^\/api\/sessions\/([^/]+)\/scenarios\/([^/]+)\/responses\/([^/]+)\/rating$/u,
  )
  if (request.method === 'PUT' && ratingMatch) {
    return handleResponseRating(
      request,
      env,
      ratingMatch[1],
      ratingMatch[2],
      ratingMatch[3],
    )
  }

  const completeMatch = url.pathname.match(
    /^\/api\/sessions\/([^/]+)\/complete$/u,
  )
  if (request.method === 'POST' && completeMatch) {
    return handleCompleteStudy(request, env, completeMatch[1])
  }

  const sessionMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)$/u)
  if (request.method === 'DELETE' && sessionMatch) {
    return handleAbandonStudy(request, env, sessionMatch[1])
  }

  return json(request, { error: 'Not found.' }, 404)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await routeRequest(request, env)
    } catch (error) {
      console.error(error)
      return json(request, { error: 'Unable to process the request.' }, 500)
    }
  },
  scheduled(
    controller: ScheduledController,
    env: Env,
    context: ExecutionContext,
  ): void {
    if (!isElevenPmEastern(controller.scheduledTime)) return
    context.waitUntil(
      syncPendingSessionsToRedcap(env).then((sessionCount) => {
        console.log(`REDCap nightly sync completed for ${sessionCount} sessions.`)
      }),
    )
  },
} satisfies ExportedHandler<Env>
