import { mount } from '../mount';
import { LegalPage } from './LegalPage';

mount(
  <LegalPage title="Terms" updated="October 7, 2026">
    <div className="callout">
      <p>
        This is a placeholder written while Acadence is in pre-release development. Full terms of service will be
        published before any public launch.
      </p>
    </div>
    <h2>Pre-release software</h2>
    <p>
      Acadence is under active development. Features described on this site may change, and pre-release builds are
      provided as-is, without guarantees of availability or accuracy. Always confirm deadlines and grades in your
      school’s official systems.
    </p>
    <h2>Trademarks</h2>
    <p>
      Canvas is a trademark of Instructure, Inc. Acadence is an independent project and is not affiliated with,
      endorsed by or sponsored by Instructure.
    </p>
    <h2>Changes</h2>
    <p>These terms will be updated as Acadence approaches a public release. The date above shows the latest revision.</p>
  </LegalPage>,
);
