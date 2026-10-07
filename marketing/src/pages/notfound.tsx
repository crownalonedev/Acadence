import { mount } from '../mount';
import { Shell } from '../components/Shell';

mount(
  <Shell>
    <div className="container prose-page" style={{ textAlign: 'center', marginInline: 'auto' }}>
      <span className="overline">404</span>
      <h1>This page isn’t on the syllabus.</h1>
      <p style={{ color: 'var(--muted)' }}>The page you’re looking for doesn’t exist or has moved.</p>
      <div className="hero-ctas">
        <a className="btn btn-primary" href="/">
          Back to Acadence
        </a>
      </div>
    </div>
  </Shell>,
);
