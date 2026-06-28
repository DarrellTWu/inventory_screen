import { useDroppable } from '@dnd-kit/core';
import type { Item, StashLocation } from '@/types';
import { ItemCell } from './ItemCell';

/**
 * Off-body stash: a labeled sub-grid per StashLocation (car, nightstand…).
 * Locations are uncapped drop targets. The Tabler icon comes from
 * `location.icon`; the icon font is loaded in index.html.
 */
interface StashPanelProps {
  stash: StashLocation[];
  items: Record<string, Item>;
  selectedRefId: string | null;
  onSelect: (refId: string) => void;
  onAddItem: (holderId: string) => void;
}

export function StashPanel({ stash, items, selectedRefId, onSelect, onAddItem }: StashPanelProps) {
  const total = stash.reduce((n, l) => n + l.items.length, 0);

  return (
    <div className="stash">
      <div className="shead">
        <i className="ti ti-archive" style={{ fontSize: 11, color: '#4a4a6a' }} />
        <span className="st">Stash</span>
        <span className="sc">{total} items</span>
      </div>

      {stash.map((loc) => (
        <StashLocationRow
          key={loc.id}
          loc={loc}
          items={items}
          selectedRefId={selectedRefId}
          onSelect={onSelect}
          onAddItem={onAddItem}
        />
      ))}

      <div className="hint">double-click a dot to create container</div>
    </div>
  );
}

function StashLocationRow({
  loc,
  items,
  selectedRefId,
  onSelect,
  onAddItem,
}: {
  loc: StashLocation;
  items: Record<string, Item>;
  selectedRefId: string | null;
  onSelect: (refId: string) => void;
  onAddItem: (holderId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: loc.id });

  return (
    <div
      ref={setNodeRef}
      className="sloc"
      style={{ background: isOver ? 'var(--cell-hover)' : undefined }}
    >
      <div className="slh">
        <i className={`ti ti-${loc.icon} sli`} />
        <span className="sln">{loc.name}</span>
        <span className="sln2">{loc.items.length}</span>
        <button className="ch-del" title="Add item" onClick={() => onAddItem(loc.id)}>
          +
        </button>
      </div>
      <div className="sg">
        {loc.items.map((ref) => (
          <ItemCell
            key={ref.id}
            refId={ref.id}
            item={items[ref.itemId]}
            quantity={ref.quantity}
            fromHolderId={loc.id}
            selected={ref.id === selectedRefId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
