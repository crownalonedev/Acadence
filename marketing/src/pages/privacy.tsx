import { mount } from '../mount';
import { LegalPage } from './LegalPage';

mount(
  <LegalPage title="Privacy" updated="October 7, 2026">
    <div className="callout">
      <p>
        This is a placeholder written while Acadence is in pre-release development. It will be replaced with a full
        privacy policy before any public launch.
      </p>
    </div>
    <h2>This website</h2>
    <p>
      This marketing site is a static website. It doesn’t use cookies, analytics or tracking scripts. If you pick a
      light or dark theme, that preference is saved in your own browser’s local storage and never leaves your device.
    </p>
    <h2>The Acadence app</h2>
    <p>The current development build of Acadence works like this:</p>
    <ul>
      <li>
        The Acadence Connector browser extension reads academic data (courses, assignments, grades, announcements and
        assignment groups) from the Canvas account you’re already signed in to, and only when you choose to sync.
      </li>
      <li>Acadence does not store your Canvas password or Canvas access tokens.</li>
      <li>
        Synced data is saved by the Acadence backend so it can show your information and tell you what changed between
        syncs.
      </li>
    </ul>
    <h2>Questions</h2>
    <p>
      Acadence is not affiliated with Instructure, the maker of Canvas. A contact address will be added here before
      public launch.
    </p>
  </LegalPage>,
);
