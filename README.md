# Empathetic LLMs User Study

Desktop research-study frontend and Cloudflare Worker API for collecting
questionnaire answers, scenario prompts, randomized response ratings, and
rating explanations.

## Architecture

- React 19, TypeScript, Vite, and hash-based React Router
- GitHub Pages frontend
- Cloudflare Worker API
- Cloudflare D1 production and researcher-test databases
- Cloudflare Turnstile verification
- Nightly REDCap batch synchronization at 11:00 PM Eastern
- Session-scoped browser drafts; D1 is the durable source of truth
- Zod validation in both the browser-facing domain and Worker request boundary

## Local commands

```bash
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm worker:check
```

Copy `.env.example` to `.env.local` to override public frontend configuration.
Never put secrets in a `VITE_*` variable because Vite includes those values in
the browser bundle.

## Cloudflare Worker setup

1. Copy `wrangler.example.jsonc` to the ignored `wrangler.jsonc` file.
2. Replace both D1 database ID placeholders with the IDs shown in the
   Cloudflare D1 dashboard.
3. Add these encrypted Worker Secrets in Cloudflare:

   - `TURNSTILE_SECRET_KEY`
   - `PARTICIPANT_ACCESS_CODE`
   - `RESEARCHER_ACCESS_CODE`
   - `SESSION_SIGNING_SECRET`
   - `REDCAP_API_URL`
   - `REDCAP_API_TOKEN`

4. Apply the same migration to both databases:

```bash
pnpm db:migrate:prod
pnpm db:migrate:test
```

5. Deploy the API:

```bash
pnpm worker:deploy
```

The optional `worker/admin.ts` export Worker has a separate
`wrangler.admin.example.jsonc` template. It verifies the Cloudflare Access JWT
before offering separate production and researcher-test CSV downloads.

`SESSION_SIGNING_SECRET` should contain at least 32 cryptographically random
bytes. `.dev.vars` is ignored by Git and may be created from
`.dev.vars.example` for local Worker development.

## Data flow

- Starting the study validates Turnstile and the access code on the Worker.
- Participant sessions use `PROD_DB`; researcher sessions use `TEST_DB`.
- The Worker generates and stores randomized Scenario and Response orders.
- Each page is validated and saved before navigation continues.
- The final submission is accepted only after the Worker verifies the complete
  participant dataset.
- Completed participant sessions are queued in D1 and uploaded to REDCap in one
  nightly batch at 11:00 PM America/Indiana/Indianapolis time. Failed batches
  remain queued and retry the next night.
- Researcher sessions remain in `TEST_DB` and are never sent to REDCap.
- Exit deletes an incomplete backend session and clears the browser session.

## Project layout

```text
migrations/        D1 schema migrations
worker/            Cloudflare Worker API and tests
src/data/          Study content with stable IDs and versions
src/pages/         React pages
src/services/      Worker API and session boundaries
```
