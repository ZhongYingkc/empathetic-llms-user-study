interface AdminEnv {
  PROD_DB: D1Database
  TEST_DB: D1Database
  ACCESS_TEAM_DOMAIN: string
  ACCESS_AUD: string
}

type AccessJwtPayload = {
  aud?: string[] | string
  email?: string
  exp?: number
}

type AccessJwk = JsonWebKey & { kid?: string }

type AccessCerts = {
  keys?: AccessJwk[]
}

type ExportDefinition = {
  filename: string
  headers: string[]
  query: string
}

const exportDefinitions: Record<string, ExportDefinition> = {
  sessions: {
    filename: 'study-sessions.csv',
    headers: [
      'id',
      'access_mode',
      'status',
      'study_version',
      'scenario_order_json',
      'response_orders_json',
      'created_at',
      'updated_at',
      'completed_at',
    ],
    query: `SELECT id, access_mode, status, study_version,
      scenario_order_json, response_orders_json, created_at, updated_at,
      completed_at FROM study_sessions ORDER BY created_at`,
  },
  questionnaires: {
    filename: 'questionnaire-answers.csv',
    headers: [
      'session_id',
      'questionnaire_id',
      'item_id',
      'value',
      'updated_at',
    ],
    query: `SELECT session_id, questionnaire_id, item_id, value, updated_at
      FROM questionnaire_answers
      ORDER BY session_id, questionnaire_id, item_id`,
  },
  prompts: {
    filename: 'scenario-prompts.csv',
    headers: [
      'session_id',
      'scenario_id',
      'display_position',
      'prompt',
      'updated_at',
    ],
    query: `SELECT session_id, scenario_id, display_position, prompt, updated_at
      FROM scenario_prompts ORDER BY session_id, display_position`,
  },
  evaluations: {
    filename: 'response-evaluations.csv',
    headers: [
      'session_id',
      'scenario_id',
      'response_id',
      'scenario_display_position',
      'response_display_position',
      'content_version',
      'reason',
      'updated_at',
    ],
    query: `SELECT session_id, scenario_id, response_id,
      scenario_display_position, response_display_position, content_version,
      reason, updated_at FROM response_evaluations
      ORDER BY session_id, scenario_display_position, response_display_position`,
  },
  ratings: {
    filename: 'response-rating-items.csv',
    headers: [
      'session_id',
      'scenario_id',
      'response_id',
      'item_id',
      'value',
      'updated_at',
    ],
    query: `SELECT session_id, scenario_id, response_id, item_id, value,
      updated_at FROM response_rating_items
      ORDER BY session_id, scenario_id, response_id, item_id`,
  },
}

let cachedKeys: AccessJwk[] | null = null
let keysCachedAt = 0

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function decodeJwtJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))) as T
}

async function getAccessKeys(env: AdminEnv): Promise<AccessJwk[]> {
  if (cachedKeys && Date.now() - keysCachedAt < 60 * 60 * 1000) {
    return cachedKeys
  }
  const teamDomain = env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//u, '').replace(
    /\/$/u,
    '',
  )
  const response = await fetch(
    `https://${teamDomain}/cdn-cgi/access/certs`,
  )
  if (!response.ok) throw new Error('Unable to load Access certificates')
  const certs = (await response.json()) as AccessCerts
  cachedKeys = certs.keys ?? []
  keysCachedAt = Date.now()
  return cachedKeys
}

async function authenticateAccess(
  request: Request,
  env: AdminEnv,
): Promise<string | null> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!token) return null
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null

  try {
    const header = decodeJwtJson<{ alg?: string; kid?: string }>(encodedHeader)
    const payload = decodeJwtJson<AccessJwtPayload>(encodedPayload)
    if (header.alg !== 'RS256' || !header.kid || !payload.email || !payload.exp) {
      return null
    }
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!audiences.includes(env.ACCESS_AUD) || payload.exp * 1000 <= Date.now()) {
      return null
    }

    const jwk = (await getAccessKeys(env)).find(
      (candidate) => candidate.kid === header.kid,
    )
    if (!jwk) return null
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(encodedSignature).buffer as ArrayBuffer,
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    )
    return valid ? payload.email : null
  } catch {
    return null
  }
}

function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@]/u.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

function rowsToCsv(headers: string[], rows: Record<string, unknown>[]): string {
  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\r\n')
}

function adminPage(): Response {
  const links = Object.keys(exportDefinitions)
    .map(
      (name) =>
        `<li><a href="/export/${name}.csv?database=prod">${name} — production</a> · <a href="/export/${name}.csv?database=test">test</a></li>`,
    )
    .join('')
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Study exports</title><style>body{font:16px system-ui;max-width:760px;margin:64px auto;padding:0 24px;line-height:1.6}a{color:#1769c2}code{background:#f3f5f8;padding:2px 5px;border-radius:4px}</style><h1>Empathetic AI study exports</h1><p>Downloads are protected by Cloudflare Access. Production and researcher-test data are kept separate.</p><ul>${links}</ul>`,
    {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}

export default {
  async fetch(request: Request, env: AdminEnv): Promise<Response> {
    const email = await authenticateAccess(request, env)
    if (!email) return new Response('Unauthorized', { status: 401 })

    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/') return adminPage()

    const match = url.pathname.match(/^\/export\/([a-z-]+)\.csv$/u)
    const definition = match ? exportDefinitions[match[1]] : undefined
    if (request.method !== 'GET' || !definition) {
      return new Response('Not found', { status: 404 })
    }

    const databaseName = url.searchParams.get('database')
    if (databaseName !== 'prod' && databaseName !== 'test') {
      return new Response('Choose database=prod or database=test', { status: 400 })
    }
    const database = databaseName === 'prod' ? env.PROD_DB : env.TEST_DB
    const result = await database.prepare(definition.query).all<Record<string, unknown>>()
    const csv = rowsToCsv(definition.headers, result.results)
    return new Response(csv, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${databaseName}-${definition.filename}"`,
        'Content-Type': 'text/csv; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'X-Exported-By': email,
      },
    })
  },
} satisfies ExportedHandler<AdminEnv>
