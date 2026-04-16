import { useState, type FormEvent } from 'react';
import type { CoreValue } from '../lib/types';

type Props = {
  values: CoreValue[];
  editable?: boolean;
  disabled?: boolean;
  onAdd?: (text: string) => void;
  onEdit?: (id: string, text: string) => void;
  onDelete?: (id: string) => void;
};

export function CoreValuesDisplay({
  values,
  editable = false,
  disabled = false,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onAdd || disabled || !draft.trim()) return;
    onAdd(draft);
    setDraft('');
  };

  const startEdit = (value: CoreValue) => {
    setEditingId(value.id);
    setEditText(value.text);
    setDeletingId(null);
  };

  const confirmEdit = () => {
    if (editingId && editText.trim() && onEdit) {
      onEdit(editingId, editText);
    }
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const startDelete = (id: string) => {
    setDeletingId(id);
    setEditingId(null);
  };

  const confirmDelete = () => {
    if (deletingId && onDelete) {
      onDelete(deletingId);
    }
    setDeletingId(null);
  };

  return (
    <section className="panel stack-lg animate-pulse-glow">
      <div className="section-header">
        <div>
          <p className="eyebrow">Governing Layer</p>
          <h2>Core Values</h2>
        </div>
        <p className="section-copy">
          These values sit above every weekly mission and define how the work gets done.
        </p>
      </div>

      {values.length > 0 ? (
        <div className="pill-row stagger-in">
          {values.map((value, index) => (
            <article 
              className="pill-card" 
              key={value.id}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {editingId === value.id ? (
                <div className="inline-edit-form">
                  <input
                    autoFocus
                    className="text-input"
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }}
                    value={editText}
                  />
                  <div className="inline-actions">
                    <button className="button small" onClick={confirmEdit} type="button">Save</button>
                    <button className="button ghost small" onClick={cancelEdit} type="button">Cancel</button>
                  </div>
                </div>
              ) : deletingId === value.id ? (
                <div className="inline-confirm">
                  <p className="danger-text">Delete &quot;{value.text}&quot;?</p>
                  <div className="inline-actions">
                    <button className="button danger small" onClick={confirmDelete} type="button">Yes, delete</button>
                    <button className="button ghost small" onClick={() => setDeletingId(null)} type="button">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p>{value.text}</p>
                  {editable ? (
                    <div className="inline-actions">
                      <button className="button ghost small" onClick={() => startEdit(value)} type="button">Edit</button>
                      <button className="button ghost small danger-text" onClick={() => startDelete(value.id)} type="button">Delete</button>
                    </div>
                  ) : null}
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state animate-fade-in">
          <p>Add at least one value so the app has a governing code to work from.</p>
        </div>
      )}

      {editable ? (
        <form className="form-row" onSubmit={handleSubmit}>
          <input
            className="text-input"
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a value like Integrity, Courage, or Presence"
            value={draft}
          />
          <button className="button" disabled={disabled || !draft.trim()} type="submit">
            Add Value
          </button>
        </form>
      ) : null}
    </section>
  );
}
