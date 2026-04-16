import { useState, type FormEvent } from 'react';
import type { MissionCategory, MissionItem } from '../lib/types';
import { normalizeOptionText } from '../lib/utils';
import { CATEGORY_VISUALS } from '../lib/visuals';
import { CategoryEmblem } from './CategoryEmblem';

type Props = {
  title: string;
  description: string;
  category?: MissionCategory;
  items: MissionItem[];
  mode?: 'edit' | 'select';
  selectedId?: string | null;
  eligibleIds?: string[];
  disabled?: boolean;
  error?: string;
  lockedItemIds?: string[];
  presets?: readonly string[];
  onSelect?: (id: string) => void;
  onAdd?: (text: string) => void;
  onEdit?: (id: string, text: string) => void;
  onDelete?: (id: string) => boolean | void;
  onToggleActive?: (id: string) => void;
};

export function CategoryList({
  title,
  description,
  category,
  items,
  mode = 'edit',
  selectedId,
  eligibleIds = [],
  disabled = false,
  error,
  lockedItemIds = [],
  presets = [],
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
}: Props) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const existingTexts = new Set(items.map((item) => normalizeOptionText(item.text)));
  const showPresets = mode === 'edit' && presets.length > 0 && !!onAdd;
  const visual = category ? CATEGORY_VISUALS[category] : null;

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onAdd || disabled || !draft.trim()) return;
    onAdd(draft);
    setDraft('');
  };

  const startEdit = (item: MissionItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setDeletingId(null);
    setDeleteError('');
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
    setDeleteError('');
  };

  const confirmDelete = () => {
    if (deletingId && onDelete) {
      const result = onDelete(deletingId);
      if (result === false) {
        setDeleteError("This one is part of your current week — you can remove it after.");
        return;
      }
    }
    setDeletingId(null);
    setDeleteError('');
  };

  return (
    <section className="panel stack-lg animate-slide-up">
      <div className="section-header">
        <div>
          <p className="eyebrow">Mission Category</p>
          <div className="section-heading-row">
            {category ? <CategoryEmblem category={category} decorative size="sm" /> : null}
            <div>
              <h3>{title}</h3>
              {visual ? <p className="section-copy category-orbit-label">{visual.orbitName}</p> : null}
            </div>
          </div>
        </div>
        <p className="section-copy">{description}</p>
      </div>

      {showPresets ? (
        <div className="preset-block">
          <p className="eyebrow">Templates</p>
          <div className="pill-row">
            {presets.map((preset) => {
              const isAdded = existingTexts.has(normalizeOptionText(preset));
              return (
                <button
                  className="button secondary small"
                  disabled={disabled || isAdded}
                  key={preset}
                  onClick={() => {
                    if (!onAdd || disabled || isAdded) return;
                    onAdd(preset);
                  }}
                  title={isAdded ? 'Already added' : `Add this ${title.toLowerCase()} mission`}
                  type="button"
                >
                  {isAdded ? preset : `+ ${preset}`}
                </button>
              );
            })}
          </div>
          <p className="step-hint-subtle">Pick from these or add your own below.</p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="item-list stagger-in">
          {items.map((item, index) => {
            const isEligible = mode === 'select' ? eligibleIds.includes(item.id) : true;
            const isLocked = lockedItemIds.includes(item.id);
            const isSelected = selectedId === item.id;
            const isEditing = editingId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <article
                className={[
                  'item-card',
                  mode === 'select' ? 'is-select-mode' : '',
                  isSelected ? 'is-selected' : '',
                  mode === 'select' && !isEligible ? 'is-disabled' : '',
                  !item.isActive ? 'is-muted' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={item.id}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={mode === 'select' && isEligible && !disabled ? () => onSelect?.(item.id) : undefined}
              >
                <div className="item-card-selection-glow" aria-hidden="true" />
                <div className="item-card-rail" aria-hidden="true" />
                <div className="item-card-main">
                  {isEditing ? (
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
                  ) : isDeleting ? (
                    <div className="inline-confirm">
                      <p className="danger-text">Delete &quot;{item.text}&quot;?</p>
                      {deleteError && <p className="field-error animate-shake">{deleteError}</p>}
                      <div className="inline-actions">
                        <button className="button danger small" onClick={confirmDelete} type="button">Yes, delete</button>
                        <button className="button ghost small" onClick={() => { setDeletingId(null); setDeleteError(''); }} type="button">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="item-card-header">
                        <p className="item-card-title">{item.text}</p>
                        {mode === 'select' ? (
                          <span className={`badge ${isSelected ? 'selected' : isEligible ? 'available' : 'used'}`}>
                            {isSelected ? 'Chosen' : isEligible ? 'Available now' : 'Used this rotation'}
                          </span>
                        ) : null}
                      </div>
                      <div className="badge-row">
                        {mode === 'select' ? (
                          <span className="availability-dot" style={{ opacity: isEligible ? 1 : 0 }} />
                        ) : null}
                        {mode === 'edit' ? (
                          <span className={`badge ${item.isActive ? 'available' : 'used'}`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        ) : null}
                        {isLocked ? <span className="badge locked">Locked in active cycle</span> : null}
                      </div>
                    </>
                  )}
                </div>

                {!isEditing && !isDeleting && mode === 'select' ? (
                  <button
                    className={`button ${isSelected ? 'selected-action' : 'secondary'}`}
                    disabled={!isEligible || disabled}
                    onClick={(e) => { e.stopPropagation(); onSelect?.(item.id); }}
                    type="button"
                  >
                    {isSelected ? 'Chosen' : 'Choose'}
                  </button>
                ) : null}

                {!isEditing && !isDeleting && mode === 'edit' ? (
                  <div className="inline-actions">
                    <button className="button ghost small" onClick={() => startEdit(item)} type="button">
                      Edit
                    </button>
                    <button
                      className="button ghost small"
                      disabled={disabled || isLocked}
                      onClick={() => onToggleActive?.(item.id)}
                      type="button"
                    >
                      {item.isActive ? 'Pause' : 'Reactivate'}
                    </button>
                    <button
                      className="button ghost small danger-text"
                      disabled={disabled || isLocked}
                      onClick={() => startDelete(item.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state animate-fade-in">
          <p>No focuses here yet. Add one to get started — you can always change it later.</p>
        </div>
      )}

      {error ? <p className="field-error animate-shake">{error}</p> : null}

      {mode === 'edit' ? (
        <form className="form-row" onSubmit={handleAdd}>
          <input
            className="text-input"
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={200}
            placeholder={`Or type your own ${title.toLowerCase()} focus`}
            value={draft}
          />
          <button className="button" disabled={disabled || !draft.trim()} type="submit">
            Add
          </button>
        </form>
      ) : null}
    </section>
  );
}
