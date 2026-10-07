import { ArrowRight, Mail } from 'lucide-react';
import { GitHubIcon } from '../components/GitHubIcon';
import { site } from '../site';

export function FinalCta() {
  const hasAction = Boolean(site.contactEmail || site.githubUrl);
  return (
    <section id="early-access" className="section" aria-labelledby="cta-title">
      <div className="container">
        <div className="cta-band reveal">
          <span className="overline">Follow development</span>
          <h2 id="cta-title">
            Less hunting.
            <br />
            More doing.
          </h2>
          <p>
            Acadence is getting ready for its first public beta. Check back here for launch news, or get in touch if
            you’d like to try it early.
          </p>
          <div className="hero-ctas">
            {site.contactEmail ? (
              <a className="btn btn-light" href={`mailto:${site.contactEmail}?subject=Acadence%20early%20access`}>
                <Mail size={17} aria-hidden="true" /> Request early access
              </a>
            ) : null}
            {site.githubUrl ? (
              <a className="btn btn-ghost-light" href={site.githubUrl}>
                <GitHubIcon /> Follow on GitHub <ArrowRight size={16} aria-hidden="true" />
              </a>
            ) : null}
            {!hasAction ? (
              <span className="coming-soon">
                <i aria-hidden="true" /> Public beta: coming soon
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
