import { useState } from 'react';
import type { ContainerKind, Zone } from '@/types';
import { Modal } from './Modal';

/**
 * The double-click-a-dot flow: pick a kind, name, and capacity for a new
 * container anchored to `zone`. Name defaults from the kind; capacity has a
 * sensible per-kind default the user can override.
 */
const KINDS: ContainerKind[] = [
  'wallet',
  'keychain',
  'pocket',
  'belt',
  'holster',
  'bag',
  'pouch',
  'watch',
  'custom',
];

const DEFAULT_CAPACITY: Record<ContainerKind, number> = {
  watch: 1,
  belt: 1,
  wallet: 8,
  keychain: 8,
  bag: 8,
  pocket: 4,
  holster: 4,
  pouch: 4,
  custom: 4,
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface CreateContainerDialogProps {
  zone: Zone;
  onConfirm: (kind: ContainerKind, name: string, capacity: number) => void;
  onCancel: () => void;
}

export function CreateContainerDialog({ zone, onConfirm, onCancel }: CreateContainerDialogProps) {
  const [kind, setKind] = useState<ContainerKind>('pocket');
  const [name, setName] = useState('Pocket');
  // Track whether the user has hand-edited the name, so changing the kind keeps
  // updating the default name until they take it over.
  const [nameEdited, setNameEdited] = useState(false);
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY.pocket);

  function pickKind(next: ContainerKind) {
    setKind(next);
    setCapacity(DEFAULT_CAPACITY[next]);
    if (!nameEdited) setName(cap(next));
  }

  return (
    <Modal title={`New container · ${zone.label ?? zone.id}`} onClose={onCancel}>
      <div className="field">
        <label>Kind</label>
        <select value={kind} onChange={(e) => pickKind(e.target.value as ContainerKind)}>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {cap(k)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameEdited(true);
          }}
          placeholder={cap(kind)}
        />
      </div>

      <div className="field">
        <label>Capacity (slots)</label>
        <input
          type="number"
          min={1}
          max={64}
          value={capacity}
          onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
        />
      </div>

      <div className="dialog-actions">
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn primary"
          onClick={() => onConfirm(kind, name.trim() || cap(kind), capacity)}
        >
          Create
        </button>
      </div>
    </Modal>
  );
}
