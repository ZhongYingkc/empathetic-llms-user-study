# Empathetic LLMs User Study

Frontend for a research study in which participants provide text responses and
rate empathetic AI outputs.

## Technology decisions

- **Language:** TypeScript
- **UI framework:** React 19
- **Build tool:** Vite 8
- **Routing:** React Router with hash-based URLs for GitHub Pages compatibility
- **Forms:** React Hook Form
- **Validation:** Zod
- **State:** React state/context; no global state library until the flow requires it
- **Draft persistence:** Browser `localStorage` for incomplete responses only
- **Backend boundary:** Native `fetch`, configured through `VITE_API_BASE_URL`
- **Testing:** Vitest
- **Code quality:** ESLint and TypeScript strict mode
- **Package manager:** pnpm
- **Frontend hosting:** GitHub Pages
- **Planned backend:** Cloudflare Workers with a durable database

## Commands

```bash
pnpm install
pnpm dev
pnpm check
pnpm build
```

Copy `.env.example` to `.env.local` when a backend endpoint is available. Do not
store secrets in `VITE_*` variables because they are included in the browser
bundle.

## Source layout

```text
src/
├── config/       # Routes and environment-level configuration
├── domain/       # Survey types, schemas, and business rules
├── services/     # API and browser storage boundaries
├── App.tsx       # Application shell; real pages are not implemented yet
└── main.tsx      # Browser entry point
```
