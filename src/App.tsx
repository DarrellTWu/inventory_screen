import { useEffect } from 'react';
import { useInventory } from '@/store/useInventory';
import { ShareDecodeError } from '@/lib/share';
import { clearHash, readCodeFromHash } from '@/lib/shareUrl';
import { InventoryScreen } from '@/components/InventoryScreen';

/**
 * App shell: imports a build if the URL carries a share code (#build=...),
 * then renders the full inventory screen. All interaction lives in
 * InventoryScreen and the store.
 */
export default function App() {
  const importBuildCode = useInventory((s) => s.importBuildCode);

  // On load, import a build from the URL hash if present.
  useEffect(() => {
    const code = readCodeFromHash();
    if (!code) return;
    try {
      importBuildCode(code);
    } catch (err) {
      if (!(err instanceof ShareDecodeError)) throw err;
      // Bad link: ignore and fall through to the local/seeded build.
      console.warn('Ignored bad share link:', err.message);
    } finally {
      clearHash();
    }
  }, [importBuildCode]);

  return <InventoryScreen />;
}
