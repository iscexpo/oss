# Vibe Coding Platform

An end-to-end coding platform where users enter text prompts and an AI agent generates full-stack applications in a sandboxed environment with live preview, file explorer, and command logs.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-description=A+full-stack+coding+platform+built+with+Vercel%27s+AI+Cloud%2C+AI+SDK%2C+and+Next.js.&demo-image=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fv1754588832%2FOSSvibecodingplatform%2Fscreenshot.png&demo-title=Vibe+Coding+Platform&demo-url=https%3A%2F%2Fvercel.fyi%2Fvibes&project-name=Vibe+Coding+Platform&repository-name=vibe-coding-platform&repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fexamples%2Ftree%2Fmain%2Fapps%2Fvibe-coding-platform&from=vibe-coding-platform-app)

## Features

- Multi-model support via AI Gateway (Claude, GPT, Grok)
- Secure code execution with Vercel Sandbox
- Real-time live preview of generated apps
- File explorer for browsing project files
- Command logs and error monitoring
- One-click deploy to Vercel

## Tech Stack

- [Next.js](https://nextjs.org) with Turbopack
- [AI SDK](https://ai-sdk.dev) v6
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

## Monorepo Structure

This is a Turborepo monorepo mirroring the architecture of the
[v0-clone example](https://github.com/vercel-labs/v0-sdk/blob/main/examples/v0-clone):

```
apps/
├── web/            # Host application (port 3000)
│   ├── app/        #   App Router pages + /api handlers (server-side AI + sandbox)
│   ├── components/ #   chat, preview, file-explorer, ui primitives…
│   ├── ai/         #   gateway, tools, streamed data-part schemas
│   └── lib/        #   preview-proxy origin resolution, proxy authorization
└── sandbox-proxy/  # Isolated preview origin (port 3001)
    ├── proxy.ts    #   Middleware rewriting root-relative preview assets
    ├── app/api/preview/[sandboxId]/…  # Reverse proxy to the sandbox domain
    └── lib/        #   origins, authorization, upstream proxying, loading page
```

### Why two apps?

Generated previews are untrusted code. Following the v0-clone security model,
the preview iframe never points at the web application origin — it points at a
**separate, independently deployed `sandbox-proxy` origin**. The proxy:

1. Resolves the public sandbox domain server-side from `sandboxId` + `port`.
2. Relays preview content (assets included) with origin-tracking and
   hop-by-hop headers stripped and framing restrictions removed.
3. Serves a loading page while a sandbox is still booting, broadcasting a
   `v0-preview-loading` `postMessage` to the host app.
4. Authorizes requests against the resolved web origin (same-origin baseline).

Local development runs both apps: `pnpm dev` starts the web app on
`http://localhost:3000` and the preview proxy on `http://localhost:3001`.

## Getting Started

### Run Locally

```bash
pnpm install
cp .env.example .env.local   # then fill in KILO_API_KEY
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Used by | Purpose |
| --- | --- | --- |
| `KILO_API_KEY` | web | AI Gateway credential |
| `KILO_GATEWAY_BASE_URL` | web | AI Gateway base URL |
| `VIBE_PREVIEW_PROXY_URL` | web | Sandbox-proxy origin override (production) |
| `VIBE_CLONE_ORIGIN` | sandbox-proxy | Allowed web origin override (production) |

Origin resolution matrix (mirrors v0-clone):

| Context | Web → proxy origin | Proxy → web origin |
| --- | --- | --- |
| Local | `http://localhost:3001` | `http://localhost:3000` |
| Vercel preview | `VIBE_PREVIEW_PROXY_URL` or Related Project preview URL | `VIBE_CLONE_ORIGIN` or Related Project preview URL |
| Production | `VIBE_PREVIEW_PROXY_URL` or Related Project production URL | `VIBE_CLONE_ORIGIN` or Related Project production URL |

Deploy both apps as two Vercel projects (each `vercel.json` declares the other
as a Related Project) so branch-deployment origins resolve automatically.

## Supported Models

- Claude Opus 4.6
- Claude Sonnet 4.6
- GPT-5.3 Codex
- Grok 4.1 Reasoning

## Deploy

Click the deploy button above or run:

```bash
vc deploy
```