import { useMemo, useRef, useState } from 'react';
import { useAppTheme } from '@/context/ThemeContext';

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function sanitizeCanvasHtml(value: string) {
  return String(value || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed)\b[^>]*\/?\s*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
}

type LinkPreview = { url: string; title: string };

function previewFamily(link: LinkPreview) {
  let pathname = '';
  try {
    pathname = new URL(link.url).pathname;
  } catch {
    pathname = link.url;
  }
  const source = `${pathname} ${link.title}`.toLowerCase();
  if (/\.(ppt|pptx)(?:$|\s|[?#])/.test(source)) return 'powerpoint';
  if (/\.(doc|docx|xls|xlsx)(?:$|\s|[?#])/.test(source)) return 'office';
  if (/\.pdf(?:$|\s|[?#])/.test(source)) return 'pdf';
  return 'web';
}

function previewUrl(link: LinkPreview) {
  const family = previewFamily(link);
  if (family === 'powerpoint' || family === 'office') {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(link.url)}`;
  }
  return link.url;
}

export function CanvasRichContent({
  html,
  baseUrl,
  minHeight = 320,
}: {
  html: string;
  baseUrl?: string;
  minHeight?: number;
}) {
  const { colors } = useAppTheme();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(minHeight);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);

  const documentHtml = useMemo(() => {
    const base = baseUrl ? `<base href="${escapeAttribute(baseUrl)}">` : '';
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${base}
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    color: ${colors.text};
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 15px;
    line-height: 1.62;
    padding: 2px;
    overflow-wrap: anywhere;
  }
  h1,h2,h3,h4,h5,h6 { color: ${colors.text}; line-height: 1.24; margin: 1.3em 0 .55em; }
  h1:first-child,h2:first-child,h3:first-child { margin-top: 0; }
  p { margin: .65em 0; }
  ul,ol { padding-left: 1.55rem; margin: .65em 0; }
  li { margin: .28em 0; }
  a { color: ${colors.accent}; text-decoration-thickness: 1px; text-underline-offset: 2px; cursor: pointer; }
  img,video { max-width: 100%; height: auto; border-radius: 10px; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th,td { border: 1px solid ${colors.border}; padding: 9px 10px; text-align: left; vertical-align: top; }
  th { background: ${colors.accentSoft}; color: ${colors.text}; font-weight: 800; }
  blockquote { margin: 1rem 0; padding: .7rem 1rem; border-left: 3px solid ${colors.accent}; background: ${colors.accentSoft}; border-radius: 0 10px 10px 0; }
  hr { border: 0; border-top: 1px solid ${colors.border}; margin: 1.2rem 0; }
  pre,code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  pre { overflow: auto; padding: 12px; border-radius: 10px; background: ${colors.accentSoft}; }
</style>
</head>
<body>${sanitizeCanvasHtml(html)}</body>
</html>`;
  }, [html, baseUrl, colors.text, colors.accent, colors.accentSoft, colors.border]);

  const resize = () => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    const next = Math.max(
      minHeight,
      doc.documentElement?.scrollHeight || 0,
      doc.body?.scrollHeight || 0,
    );
    if (Number.isFinite(next)) setHeight(Math.min(next + 4, 2400));
  };

  const wireLinks = () => {
    const doc = frame.current?.contentDocument;
    if (!doc || doc.documentElement.dataset.acadenceLinks === 'ready') return;
    doc.documentElement.dataset.acadenceLinks = 'ready';
    doc.addEventListener('click', (event) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const raw = anchor.getAttribute('href') || '';
      if (!raw || raw.startsWith('#')) return;
      try {
        const resolved = new URL(raw, doc.baseURI);
        if (!['http:', 'https:'].includes(resolved.protocol)) return;
        event.preventDefault();
        event.stopPropagation();
        setLinkPreview({
          url: resolved.href,
          title: anchor.textContent?.trim() || decodeURIComponent(resolved.pathname.split('/').pop() || '') || resolved.hostname,
        });
      } catch {
        /* Let malformed/non-web links keep their browser behavior. */
      }
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <iframe
        ref={frame}
        title="Canvas content"
        srcDoc={documentHtml}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => {
          resize();
          wireLinks();
          const doc = frame.current?.contentDocument;
          if (doc && typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(resize);
            observer.observe(doc.body);
            setTimeout(() => observer.disconnect(), 15000);
          }
        }}
        style={{
          display: 'block',
          width: '100%',
          height,
          minHeight,
          border: 0,
          background: 'transparent',
        }}
      />

      {linkPreview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={linkPreview.title}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(11, 22, 16, .42)',
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          <div
            style={{
              width: 'min(1180px, 100%)',
              height: 'min(860px, 92vh)',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 18,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 70px rgba(12, 27, 18, .22)',
            }}
          >
            <div
              style={{
                minHeight: 60,
                padding: '10px 12px 10px 16px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: colors.text, fontSize: 14, fontWeight: 800, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {linkPreview.title}
                </div>
                <div style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>
                  {previewFamily(linkPreview) === 'powerpoint' ? 'PowerPoint · Acadence reader' : 'External link · Acadence reader'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.open(linkPreview.url, '_blank', 'noopener,noreferrer')}
                style={{
                  height: 34,
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.accent,
                  padding: '0 11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Open externally
              </button>
              <button
                type="button"
                aria-label="Close link viewer"
                onClick={() => setLinkPreview(null)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.text,
                  fontSize: 18,
                  lineHeight: '30px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
            <iframe
              title={linkPreview.title}
              src={previewUrl(linkPreview)}
              style={{ width: '100%', flex: 1, minHeight: 0, border: 0, background: '#fff' }}
              allow="autoplay; fullscreen"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
