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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
  a { color: ${colors.accent}; text-decoration-thickness: 1px; text-underline-offset: 2px; }
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

  return (
    <iframe
      ref={frame}
      title="Canvas content"
      srcDoc={documentHtml}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      onLoad={() => {
        resize();
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
  );
}
