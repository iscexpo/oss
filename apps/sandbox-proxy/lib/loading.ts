import 'server-only'

/**
 * Minimal loading page for a still-booting sandbox preview. Broadcasts the
 * `v0-preview-loading` postMessage every 250ms (so the web app can show its
 * own overlay) and self-redirects to the real preview path after a short
 * delay, creating a retry loop until the sandbox starts serving.
 */
export function previewLoadingHtml(sandboxId: string, port: number): Response {
  const target = `/api/preview/${sandboxId}?port=${port}`

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="robots" content="noindex" />
<title>Loading preview…</title>
<style>
  html, body { margin: 0; height: 100%; background: #fafafa; }
  body { display: grid; place-items: center; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #555; }
  .loader { display: flex; flex-direction: column; align-items: center; gap: 12px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
  .spinner { width: 24px; height: 24px; border: 2px solid #e5e5e5; border-top-color: #111; border-radius: 50%; animation: spin 800ms linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <span>Loading preview…</span>
  </div>
  <script>
    const target = ${JSON.stringify(target)};
    const broadcast = () => parent.postMessage({ type: 'v0-preview-loading' }, '*');
    broadcast();
    setInterval(broadcast, 250);
    setTimeout(() => { location.href = target; }, 3000);
  </script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
    },
  })
}