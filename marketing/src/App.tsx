import { Shell } from './components/Shell';
import { useReveal } from './hooks/useReveal';
import { Hero } from './sections/Hero';
import { Showcase } from './sections/Showcase';
import { HowItWorks } from './sections/HowItWorks';
import { Customize } from './sections/Customize';
import { Features } from './sections/Features';
import { Platforms } from './sections/Platforms';
import { About } from './sections/About';
import { FinalCta } from './sections/FinalCta';

export function App() {
  useReveal();
  return (
    <Shell>
      <Hero />
      <Showcase />
      <HowItWorks />
      <Customize />
      <Features />
      <Platforms />
      <About />
      <FinalCta />
    </Shell>
  );
}
