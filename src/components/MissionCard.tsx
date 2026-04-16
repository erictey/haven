type Props = {
  title: string;
  text: string;
  caption?: string;
  category?: 'build' | 'shape' | 'workWith';
  index?: number;
};

const categoryIcons: Record<string, string> = {
  build: '\u2692', // Hammer and pick
  shape: '\u2318', // Command/place of interest
  workWith: '\u2764', // Heart
};

const categoryLabels: Record<string, string> = {
  build: 'Build',
  shape: 'Shape',
  workWith: 'Work With',
};

export function MissionCard({ title, text, caption, category, index }: Props) {
  const icon = category ? categoryIcons[category] : null;
  const label = category ? categoryLabels[category] : null;

  return (
    <section 
      className="mission-card"
      style={{ 
        animationDelay: index !== undefined ? `${index * 0.1}s` : undefined 
      }}
    >
      {icon && (
        <div className="mission-card-icon" title={label || ''}>
          {icon}
        </div>
      )}
      <p className="eyebrow">{title}</p>
      <p className="mission-text">{text}</p>
      {caption ? <p className="card-caption">{caption}</p> : null}
    </section>
  );
}
