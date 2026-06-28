import type { Item } from '@/types';

/**
 * Detail panel for the selected ItemRef: icon, name, brand, weight, notes, and
 * a click-through to the source listing when `sourceUrl` is set. Also exposes
 * remove-from-holder. (Affiliate tag rewriting on the link is a later sprint.)
 */
interface ItemDetailProps {
  item: Item;
  quantity: number;
  onClose: () => void;
  onRemove: () => void;
}

export function ItemDetail({ item, quantity, onClose, onRemove }: ItemDetailProps) {
  const meta = [
    item.brand,
    item.weightGrams != null ? `${item.weightGrams} g` : null,
    quantity > 1 ? `×${quantity}` : null,
  ].filter(Boolean);

  return (
    <div className="detail">
      <div className="glyph">
        {item.iconUrl ? <img src={item.iconUrl} alt={item.name} /> : (item.emoji ?? '❓')}
      </div>
      <div className="body">
        <div className="dname">{item.name}</div>
        {meta.length > 0 && <div className="dmeta">{meta.join(' · ')}</div>}
        {item.notes && <div className="dnotes">{item.notes}</div>}
        {item.sourceUrl && (
          <div style={{ marginTop: 5 }}>
            <a className="dlink" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
              View source ↗
            </a>
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <button className="ch-del" onClick={onRemove} title="Remove from holder">
            remove
          </button>
        </div>
      </div>
      <button className="dclose" onClick={onClose} title="Close">
        ×
      </button>
    </div>
  );
}
