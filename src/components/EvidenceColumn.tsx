import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { hasElectronDataApi, saveEvidenceAttachment } from '../lib/electron';
import { getEvidenceImageSource } from '../lib/evidence';
import type { EvidenceEntry } from '../lib/types';
import type { EvidenceAttachment } from '../lib/types';

const MAX_FILE_BYTES = 1_000_000;
const MAX_DATA_URL_BYTES = 1_400_000;

function formatEvidenceTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

type Props = {
  title: string;
  missionText: string;
  entries: EvidenceEntry[];
  disabled?: boolean;
  onAdd?: (payload: { text?: string; imageDataUrl?: string; attachment?: EvidenceAttachment }) => boolean;
  onDelete?: (evidenceId: string) => void;
};

export function EvidenceColumn({
  title,
  missionText,
  entries,
  disabled = false,
  onAdd,
  onDelete,
}: Props) {
  const [draftText, setDraftText] = useState('');
  const [draftImage, setDraftImage] = useState<string>('');
  const [draftAttachment, setDraftAttachment] = useState<EvidenceAttachment | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canEdit = Boolean(onAdd);

  const handlePickImage = async (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      setError('Image too large. Use a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const url = await fileToDataUrl(file);
      if (url.length > MAX_DATA_URL_BYTES) {
        setError('Image too large. Use a smaller image.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (hasElectronDataApi()) {
        const attachment = saveEvidenceAttachment(url, file.name);
        if (attachment) {
          setDraftAttachment(attachment);
          setDraftImage(attachment.fileUrl);
          return;
        }
      }
      setDraftAttachment(null);
      setDraftImage(url);
    } catch {
      setError('Could not read image.');
    }
  };

  const clearImage = () => {
    setDraftImage('');
    setDraftAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onAdd || disabled) return;

    const text = draftText.trim();
    const imageDataUrl = draftImage.trim();
    const attachment = draftAttachment ?? undefined;

    const ok = onAdd({
      ...(text ? { text } : {}),
      ...(attachment ? { attachment } : imageDataUrl ? { imageDataUrl } : {}),
    });

    if (!ok) {
      setError('Write a note or add a photo.');
      return;
    }

    setDraftText('');
    clearImage();
    setError('');
  };

  return (
    <section className="panel stack-md evidence-card">
      <div className="section-header">
        <div>
          <p className="eyebrow">Evidence</p>
          <h3>{title}</h3>
        </div>
        <p className="section-copy">{missionText}</p>
      </div>

      {canEdit ? (
        <form className="stack-md" onSubmit={handleSubmit}>
          <textarea
            className="text-area"
            disabled={disabled}
            onChange={(e) => { setDraftText(e.target.value); setError(''); }}
            maxLength={2000}
            placeholder="What happened today? Jot down anything — big or small."
            rows={4}
            value={draftText}
          />

          <div className="evidence-actions">
            <input
              accept="image/*"
              className="text-input evidence-file"
              disabled={disabled}
              onChange={handlePickImage}
              ref={fileInputRef}
              type="file"
            />
            {draftImage ? (
              <div className="evidence-preview">
                <img alt="Selected evidence" className="evidence-preview-image" src={draftImage} />
                <button className="button ghost small" onClick={clearImage} type="button">
                  Clear photo
                </button>
              </div>
            ) : null}
          </div>

          {error ? <p className="field-error animate-shake">{error}</p> : null}

          <div className="action-row" style={{ justifyContent: 'flex-end' }}>
            <button
              className="button"
              disabled={disabled || (!draftText.trim() && !draftImage.trim())}
              type="submit"
            >
              Save this
            </button>
          </div>
        </form>
      ) : null}

      {entries.length > 0 ? (
        <div className="evidence-list stack-md">
          {entries.map((entry) => (
            <article className="evidence-entry" key={entry.id}>
              <p className="date-copy">{formatEvidenceTime(entry.createdAt)}</p>
              {entry.text ? <p className="mission-text">{entry.text}</p> : null}
              {getEvidenceImageSource(entry) ? (
                <img alt="Evidence" className="evidence-image" src={getEvidenceImageSource(entry) ?? undefined} />
              ) : null}
              {onDelete ? (
                <div className="action-row" style={{ justifyContent: 'flex-end' }}>
                  <button
                    className="button ghost small danger-text"
                    onClick={() => onDelete(entry.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state animate-fade-in">
          <p>Nothing here yet — add your first moment when you're ready.</p>
        </div>
      )}
    </section>
  );
}
