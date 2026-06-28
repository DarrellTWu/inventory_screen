import type { CSSProperties } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Container, Item, ItemRef, Zone } from '@/types';
import { ItemCell, EmptyCell } from './ItemCell';

/**
 * A floating per-zone container: header (zone · name · used/capacity, red when
 * full) over a grid sized to `capacity`. Positioned by the parent (absolute,
 * floated to the zone's side). The whole panel is a drop target for items.
 */
interface ContainerPanelProps {
  container: Container;
  zone: Zone | undefined;
  items: Record<string, Item>;
  selectedRefId: string | null;
  onSelect: (refId: string) => void;
  onAddItem: (holderId: string) => void;
  onDelete: (containerId: string) => void;
  style?: CSSProperties;
}

export function ContainerPanel({
  container,
  zone,
  items,
  selectedRefId,
  onSelect,
  onAddItem,
  onDelete,
  style,
}: ContainerPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: container.id });
  const used = container.items.length;
  const full = used >= container.capacity;
  const cols = Math.min(container.capacity, 3);

  // Filled cells, then empty placeholders up to capacity. The first empty slot
  // doubles as the "add item" affordance.
  const empties = Math.max(0, container.capacity - used);

  return (
    <div
      ref={setNodeRef}
      className="cp"
      style={{ ...style, outline: isOver && !full ? '1px solid var(--accent)' : undefined }}
    >
      <div className="ch">
        <span className="cz">{zone?.label ?? container.kind}</span>
        <span className="cn">{container.name}</span>
        <span className={`cc${full ? ' f' : ''}`}>
          {used}/{container.capacity}
        </span>
        <button
          className="ch-del"
          title={full ? 'Container full' : 'Add item'}
          disabled={full}
          onClick={() => onAddItem(container.id)}
        >
          +
        </button>
        <button
          className="ch-del"
          title="Delete container"
          onClick={() => onDelete(container.id)}
        >
          ×
        </button>
      </div>
      <div className="ig" style={{ ['--cols' as string]: cols }}>
        {container.items.map((ref: ItemRef) => (
          <ItemCell
            key={ref.id}
            refId={ref.id}
            item={items[ref.itemId]}
            quantity={ref.quantity}
            fromHolderId={container.id}
            selected={ref.id === selectedRefId}
            onSelect={onSelect}
          />
        ))}
        {Array.from({ length: empties }).map((_, i) => (
          <EmptyCell key={i} onAdd={i === 0 ? () => onAddItem(container.id) : undefined} />
        ))}
      </div>
    </div>
  );
}
