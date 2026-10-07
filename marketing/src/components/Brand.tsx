/** The pushable `acadence` wordmark pill from the app's desktop sidebar. */
export function Brand({ small = false, href = '/' }: { small?: boolean; href?: string }) {
  return (
    <a className={`brand${small ? ' sm' : ''}`} href={href} aria-label="Acadence home">
      <span className="brand-depth">
        <span className="brand-pill">
          <span className="brand-word">acadence</span>
          <span className="brand-dot" aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}

/** Non-interactive version for use inside product previews. */
export function BrandMark() {
  return (
    <span className="brand sm" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <span className="brand-depth">
        <span className="brand-pill">
          <span className="brand-word">acadence</span>
          <span className="brand-dot" />
        </span>
      </span>
    </span>
  );
}
