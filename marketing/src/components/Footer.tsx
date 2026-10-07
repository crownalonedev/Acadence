import { Brand } from './Brand';
import { site } from '../site';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-about">
            <Brand />
            <p>
              A student hub for your courses, assignments, grades and announcements, in one calm place. Currently in
              development.
            </p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h2>Product</h2>
              <ul>
                <li>
                  <a href="/#product">Overview</a>
                </li>
                <li>
                  <a href="/#features">Features</a>
                </li>
                <li>
                  <a href="/#how-it-works">How it works</a>
                </li>
                <li>
                  <a href="/#about">Status</a>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h2>More</h2>
              <ul>
                {site.githubUrl ? (
                  <li>
                    <a href={site.githubUrl}>GitHub</a>
                  </li>
                ) : null}
                <li>
                  <a href="/privacy">Privacy</a>
                </li>
                <li>
                  <a href="/terms">Terms</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} Acadence</span>
          <span>Not affiliated with Instructure or Canvas.</span>
        </div>
      </div>
    </footer>
  );
}
