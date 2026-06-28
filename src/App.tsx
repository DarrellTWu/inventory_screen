import { useEffect, useState } from 'react';
import { useActiveBuild, useInventory } from '@/store/useInventory';
import { ShareDecodeError } from '@/lib/share';
import { buildShareUrl, clearHash, readCodeFromHash } from '@/lib/shareUrl';

/**
 * Placeholder shell. Renders a minimal status view plus a working
 * export/import flow so save+share is exercisable before the real screen is
 * built. The full UI is specified in docs/wireframe.html and docs/DESIGN.md;
 * build it out under src/components/.
 */
export default function App() {
  const build = useActiveBuild();
  const stash = useInventory((s) => s.stash);
  const itemCount = useInventory((s) => Object.keys(s.items).length);
  const exportBuild = useInventory((s) => s.exportBuild);
  const importBuildCode = useInventory((s) => s.importBuildCode);
  const activeBuildId = useInventory((s) => s.activeBuildId);

  const [shareUrl, setShareUrl] = useState('');
  const [status, setStatus] = useState('');

  // On load, import a build if the URL carries a share code (#build=...).
  useEffect(() => {
    const code = readCodeFromHash();
    if (!code) return;
    try {
      importBuildCode(code);
      setStatus('Imported shared build from link.');
    } catch (err) {
      setStatus(
        err instanceof ShareDecodeError ? `Bad share link: ${err.message}` : 'Import failed.',
      );
    } finally {
      clearHash();
    }
  }, [importBuildCode]);

  function handleExport() {
    const code = exportBuild(activeBuildId, { lite: true });
    if (!code) return;
    const url = buildShareUrl(code);
    setShareUrl(url);
    navigator.clipboard?.writeText(url).then(
      () => setStatus('Share link copied to clipboard.'),
      () => setStatus('Share link ready (copy it below).'),
    );
  }

  function handleImport() {
    const input = window.prompt('Paste a share link or code:');
    if (!input) return;
    const code = input.includes('#build=') ? input.split('#build=')[1] : input.trim();
    try {
      importBuildCode(code);
      setStatus('Imported build.');
    } catch (err) {
      setStatus(err instanceof ShareDecodeError ? err.message : 'Import failed.');
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ color: 'var(--text-bright)', fontSize: 16, letterSpacing: '0.1em' }}>
        EDC INVENTORY <span style={{ color: 'var(--text-faint)' }}>// scaffold</span>
      </h1>

      <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 12, lineHeight: 1.7 }}>
        Store, seed data, and self-contained build sharing are wired up. The full
        screen is specified in <code>docs/wireframe.html</code> and{' '}
        <code>docs/DESIGN.md</code>. Build the UI under <code>src/components/</code>.
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
          stash locations: <span style={{ color: 'var(--text-bright)' }}>{stash.length}</span>
        </div>
        <div>
          catalog items: <span style={{ color: 'var(--text-bright)' }}>{itemCount}</span>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={handleExport} style={btn}>
          Export share link
        </button>
        <button onClick={handleImport} style={btn}>
          Import build
        </button>
      </div>

      {status && (
        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}>{status}</p>
      )}
      {shareUrl && (
        <textarea
          readOnly
          value={shareUrl}
          onFocus={(e) => e.currentTarget.select()}
          style={{
            marginTop: 8,
            width: '100%',
            minHeight: 64,
            background: 'var(--cell)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 8,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            wordBreak: 'break-all',
          }}
        />
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  background: 'var(--panel-head)',
  color: 'var(--text-bright)',
  border: '1px solid var(--border-active)',
  borderRadius: 'var(--radius)',
  padding: '6px 12px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  cursor: 'pointer',
};
