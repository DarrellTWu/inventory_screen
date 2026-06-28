import { useState } from 'react';
import { Modal } from './Modal';
import { useInventory } from '@/store/useInventory';
import { ShareDecodeError } from '@/lib/share';
import { buildShareUrl } from '@/lib/shareUrl';

/**
 * Export the active build to a self-contained share link (lite or full), and
 * import a build from a pasted link or code. Wraps the store's
 * exportBuild/importBuildCode — no backend.
 */
export function ShareDialog({ onClose }: { onClose: () => void }) {
  const activeBuildId = useInventory((s) => s.activeBuildId);
  const exportBuild = useInventory((s) => s.exportBuild);
  const importBuildCode = useInventory((s) => s.importBuildCode);

  const [lite, setLite] = useState(true);
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const [imported, setImported] = useState(false);

  function doExport() {
    const code = exportBuild(activeBuildId, { lite });
    if (!code) return;
    const link = buildShareUrl(code);
    setUrl(link);
    setCopied(false);
    navigator.clipboard?.writeText(link).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }

  function doImport() {
    setError('');
    setImported(false);
    const raw = importText.trim();
    if (!raw) return;
    const code = raw.includes('#build=') ? raw.split('#build=')[1] : raw;
    try {
      importBuildCode(code);
      setImported(true);
      setImportText('');
    } catch (err) {
      setError(err instanceof ShareDecodeError ? err.message : 'Import failed.');
    }
  }

  return (
    <Modal title="Share build" onClose={onClose}>
      <div className="field">
        <label>Export</label>
        <label style={{ display: 'flex', gap: 6, textTransform: 'none', color: 'var(--text-dim)' }}>
          <input
            type="checkbox"
            checked={lite}
            style={{ width: 'auto' }}
            onChange={(e) => setLite(e.target.checked)}
          />
          Lite (strip notes &amp; source URLs)
        </label>
        <button className="btn primary" style={{ marginTop: 8 }} onClick={doExport}>
          Generate link
        </button>
        {url && (
          <>
            <textarea
              className="code-box"
              style={{ marginTop: 8 }}
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
            />
            {copied && <div className="ok">Copied to clipboard.</div>}
          </>
        )}
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <label>Import</label>
        <textarea
          className="code-box"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste a share link or code"
        />
        <button className="btn" style={{ marginTop: 8 }} onClick={doImport}>
          Import build
        </button>
        {imported && <div className="ok">Imported — switched to the new build.</div>}
        {error && <div className="err">{error}</div>}
      </div>

      <div className="dialog-actions">
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
