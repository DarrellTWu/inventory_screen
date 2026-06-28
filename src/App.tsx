import { useActiveBuild, useInventory } from '@/store/useInventory';

/**
 * Placeholder shell. This intentionally renders a minimal status view so the
 * project runs out of the box and proves the store + seed data are wired up.
 *
 * The real screen is specified visually in docs/wireframe.html and described
 * in docs/DESIGN.md. Build it out as components under src/components/:
 *   <InventoryScreen>
 *     <Paperdoll />          // SVG silhouette + zone dots
 *     <ContainerPanel />     // floating per-zone grids
 *     <StashPanel />         // off-body locations
 *     <ItemCell /> <CreateContainerDialog /> <ItemDetail />
 */
export default function App() {
  const build = useActiveBuild();
  const stash = useInventory((s) => s.stash);
  const itemCount = useInventory((s) => Object.keys(s.items).length);

  return (
    <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: 'var(--text-bright)', fontSize: 16, letterSpacing: '0.1em' }}>
        EDC INVENTORY <span style={{ color: 'var(--text-faint)' }}>// scaffold</span>
      </h1>

      <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 12, lineHeight: 1.7 }}>
        The store and seed data are wired up. The full screen is specified in{' '}
        <code>docs/wireframe.html</code> and <code>docs/DESIGN.md</code>. Build the UI
        out under <code>src/components/</code>.
      </p>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          fontSize: 13,
          lineHeight: 1.8,
        }}
      >
        <div>
          active build: <span style={{ color: 'var(--text-bright)' }}>{build?.name}</span>
        </div>
        <div>
          containers:{' '}
          <span style={{ color: 'var(--text-bright)' }}>{build?.containers.length}</span>
        </div>
        <div>
          stash locations:{' '}
          <span style={{ color: 'var(--text-bright)' }}>{stash.length}</span>
        </div>
        <div>
          catalog items: <span style={{ color: 'var(--text-bright)' }}>{itemCount}</span>
        </div>
      </div>
    </div>
  );
}
