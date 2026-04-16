import {
  CATEGORY_DETAILS,
  FRAMEWORK_BLURB,
  FRAMEWORK_DESCRIPTION,
  STOIC_INSPIRATION,
} from '../lib/categoryModel';
import { BrandMark } from '../components/BrandMark';
import { ObservatoryScene } from '../components/ObservatoryScene';
import { CATEGORY_ORDER } from '../lib/types';

export function AboutScreen() {
  return (
    <section className="screen stack-xl">
      <header className="panel hero-panel animate-slide-up">
        <p className="eyebrow">About Us</p>
        <BrandMark variant="panel" />
        <div className="about-hero-scene">
          <ObservatoryScene scene="about" />
        </div>
        <p className="screen-copy">
          {FRAMEWORK_BLURB} {FRAMEWORK_DESCRIPTION} Your data stays private on your device, so the app can
          feel more like a mirror than a performance.
        </p>
      </header>

      <section className="panel stack-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">The Framework</p>
            <h3>A way to reflect on real life</h3>
          </div>
          <p className="section-copy">
            When life feels messy, this framework helps sort experience into the parts you can build,
            the parts you can shape, and the parts you need to work with wisely.
          </p>
        </div>

        <div className="mission-grid">
          {CATEGORY_ORDER.map((category) => {
            const detail = CATEGORY_DETAILS[category];

            return (
              <article className="pill-card stack-md" key={category}>
                <p className="eyebrow">{detail.title}</p>
                <p className="pill-card-text">{detail.definition}</p>
                <p className="section-copy">{detail.meaning}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel stack-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Inspired By</p>
            <h3>The Stoic dichotomy of control</h3>
          </div>
          <p className="section-copy">{STOIC_INSPIRATION}</p>
        </div>

        <div className="stack-md" style={{ maxWidth: '78ch', margin: '0 auto' }}>
          <p>
            Build lives closest to what is most up to you: your effort, practice, attention, and
            discipline.
          </p>
          <p>
            Shape holds what you can influence over time: your routines, boundaries, environment,
            and patterns.
          </p>
          <p>
            Work With makes space for what may not fully bend to your will: discomfort, uncertainty,
            loss, other people, and the reality of the moment.
          </p>
        </div>
      </section>

      <section className="panel stack-md animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Using It</p>
            <h3>Let the week stay human-sized</h3>
          </div>
          <p className="section-copy">
            The goal is not to grade your life. It is to notice where honest effort helps, where
            gentle design helps, and where acceptance helps.
          </p>
        </div>

        <ul className="stack-md" style={{ maxWidth: '78ch', margin: '0 auto' }}>
          <li>Choose focuses that feel alive and practical, not performative.</li>
          <li>Use evidence to notice small moments of alignment, not just big wins.</li>
          <li>Let the categories reduce noise so reflection becomes clearer and kinder.</li>
        </ul>
      </section>
    </section>
  );
}
