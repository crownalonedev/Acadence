import { Monitor, Smartphone, Layers } from 'lucide-react';
import { AppPreview } from '../product/AppPreview';

export function Platforms() {
  return (
    <section id="platforms" className="section" aria-labelledby="platforms-title">
      <div className="container platforms">
        <div className="reveal">
          <span className="overline">Web &amp; mobile</span>
          <h2 id="platforms-title" className="section-title">
            The same Acadence on your laptop and your phone.
          </h2>
          <p className="section-lead">
            Acadence is built as one app that adapts to the screen it’s on. You get the same courses, the same
            layout choices and the same theme, whether you’re at a desk or between classes.
          </p>
          <ul className="platform-list">
            <li>
              <span className="icon-tile" aria-hidden="true">
                <Monitor size={19} />
              </span>
              <div>
                <b>Desktop web</b>
                <span>A sidebar you can collapse and reorder, with room for courses and deadlines side by side.</span>
              </div>
            </li>
            <li>
              <span className="icon-tile" aria-hidden="true">
                <Smartphone size={19} />
              </span>
              <div>
                <b>Mobile layout</b>
                <span>On smaller screens the sidebar becomes a bottom tab bar, made for quick checks between classes.</span>
              </div>
            </li>
            <li>
              <span className="icon-tile" aria-hidden="true">
                <Layers size={19} />
              </span>
              <div>
                <b>One codebase for iOS, Android and web</b>
                <span>Built with Expo and React Native. Native app-store releases aren’t available yet.</span>
              </div>
            </li>
          </ul>
        </div>
        <div className="devices reveal" style={{ '--delay': '120ms' } as React.CSSProperties}>
          <div className="device-desktop" aria-hidden="true">
            <AppPreview label="" rows={1} />
          </div>
          <div className="phone">
            <AppPreview label="Acadence on a phone: the Home screen with a pinned assignment, upcoming deadlines and a bottom tab bar." rows={2} />
          </div>
        </div>
      </div>
    </section>
  );
}
