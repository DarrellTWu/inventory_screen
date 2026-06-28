import { useDraggable } from '@dnd-kit/core';
import type { Item } from '@/types';

/**
 * One 28px inventory cell. Renders an item's icon (image if present, else
 * emoji) with a quantity badge, or an empty placeholder slot. Filled cells are
 * draggable (drag id = the ItemRef id) and selectable.
 */
interface ItemCellProps {
  refId: string;
  item: Item | undefined;
  quantity: number;
  /** The holder this cell currently lives in — travels with the drag. */
  fromHolderId: string;
  selected: boolean;
  onSelect: (refId: string) => void;
}

export function ItemCell({
  refId,
  item,
  quantity,
  fromHolderId,
  selected,
  onSelect,
}: ItemCellProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: refId,
    data: { refId, fromHolderId },
  });

  return (
    <div
      ref={setNodeRef}
      className={`ic${selected ? ' s' : ''}`}
      style={isDragging ? { opacity: 0.3 } : undefined}
      title={item?.name}
      onClick={() => onSelect(refId)}
      {...listeners}
      {...attributes}
    >
      {item?.iconUrl ? <img src={item.iconUrl} alt={item.name} /> : (item?.emoji ?? '❓')}
      {quantity > 1 && <span className="q">×{quantity}</span>}
    </div>
  );
}

/** A dim empty slot. Clicking it opens the add-item flow for its holder. */
export function EmptyCell({ onAdd }: { onAdd?: () => void }) {
  return (
    <div
      className="ic e"
      style={onAdd ? { cursor: 'pointer' } : undefined}
      onClick={onAdd}
      title={onAdd ? 'Add item' : undefined}
    />
  );
}
