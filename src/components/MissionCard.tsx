import { CATEGORY_LABELS } from '../lib/types';
import { CATEGORY_VISUALS } from '../lib/visuals';
import { CategoryEmblem } from './CategoryEmblem';

type Props = {
  title: string;
  text: string;
  caption?: string;
  category?: 'build' | 'shape' | 'workWith';
  index?: number;
};

export function MissionCard({ title, text, caption, category, index }: Props) {
  const label = category ? CATEGORY_LABELS[category] : null;
  const visual = category ? CATEGORY_VISUALS[category] : null;

  return (
    <section 
      className={`mission-card ${category ? `mission-card-${category}` : ''}`}
      style={{ 
        animationDelay: index !== undefined ? `${index * 0.1}s` : undefined 
      }}
    >
      <div className="mission-card-orb" aria-hidden="true" />
      <div className="mission-card-frame" aria-hidden="true" />
      <div className="mission-card-topline">
        <div className="mission-card-heading">
          <p className="eyebrow">{title}</p>
          {label && visual ? (
            <span className="mission-card-label">
              {label} · {visual.orbitName}
            </span>
          ) : null}
        </div>
        {category ? <CategoryEmblem category={category} className="mission-card-icon" decorative size="sm" /> : null}
      </div>
      <div className="mission-card-divider" aria-hidden="true" />
      <div className="mission-card-body">
        <p className="mission-text">{text}</p>
      </div>
      {caption ? <p className="card-caption">{caption}</p> : null}
      {visual ? <p className="mission-card-orbit">{visual.descriptor}</p> : null}
    </section>
  );
}
