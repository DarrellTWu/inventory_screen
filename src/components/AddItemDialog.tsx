import { useState } from 'react';
import { Modal } from './Modal';

/**
 * Add an item into a holder. Two tabs:
 *  - Manual (active): emoji + name + optional brand/weight/notes.
 *  - From URL (disabled): the Reddit-style link preview, which needs the
 *    `/api/preview` Worker — a later sprint. The tab is shown to keep the seam
 *    visible.
 * The item is only created on confirm, so cancelling never orphans a catalog
 * entry.
 */
export interface NewItemDraft {
  name: string;
  emoji: string;
  brand?: string;
  weightGrams?: number;
  notes?: string;
}

const EMOJI_PRESETS = [
  '📱', '⌚', '🔪', '✏️', '💡', '🔑', '🔦', '🔧', '💊', '🆔',
  '💳', '🪪', '💵', '🎧', '🔋', '📓', '🧴', '🔌', '🗝️', '🧰',
  '🪫', '📦', '🔒', '🩹', '🧯', '📖', '📎', '✂️', '🖊️', '🧭',
  '🪥', '🧷', '🧠', '🩺',
];

interface AddItemDialogProps {
  holderName: string;
  onSubmit: (draft: NewItemDraft) => void;
  onCancel: () => void;
}

export function AddItemDialog({ holderName, onSubmit, onCancel }: AddItemDialogProps) {
  const [tab, setTab] = useState<'manual' | 'url'>('manual');
  const [emoji, setEmoji] = useState('📦');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      emoji: emoji || '📦',
      brand: brand.trim() || undefined,
      weightGrams: weight ? Number(weight) || undefined : undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Modal title={`Add item → ${holderName}`} onClose={onCancel}>
      <div className="tabs">
        <button
          className={`tab${tab === 'manual' ? ' active' : ''}`}
          onClick={() => setTab('manual')}
        >
          Manual
        </button>
        <button className="tab" disabled title="Coming in a later sprint">
          From URL
        </button>
      </div>

      <div className="field">
        <label>Emoji</label>
        <div className="emoji-grid">
          {EMOJI_PRESETS.map((e, i) => (
            <button
              key={i}
              className={e === emoji ? 'sel' : ''}
              onClick={() => setEmoji(e)}
              type="button"
            >
              {e}
            </button>
          ))}
        </div>
        <input
          style={{ marginTop: 6 }}
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="or type any emoji"
        />
      </div>

      <div className="field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" />
      </div>

      <div className="field">
        <label>Brand (optional)</label>
        <input value={brand} onChange={(e) => setBrand(e.target.value)} />
      </div>

      <div className="field">
        <label>Weight g (optional)</label>
        <input
          type="number"
          min={0}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Notes (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="dialog-actions">
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" disabled={!name.trim()} onClick={submit}>
          Add
        </button>
      </div>
    </Modal>
  );
}
