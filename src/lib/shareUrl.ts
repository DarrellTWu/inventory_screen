/**
 * Share links carry the build code in the URL *hash* (`#build=<code>`), not the
 * path or query. The hash never reaches a server, so it sidesteps server URL
 * length limits and works on any static host — fitting the no-backend phase.
 *
 * Future backend phase: a short slug like `/build/darrells-edc` resolves via an
 * API instead. The two can coexist — see docs/DESIGN.md "Sharing".
 */

const PREFIX = 'build=';

/** Build a full shareable URL for a code, based on the current origin. */
export function buildShareUrl(code: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${PREFIX}${code}`;
}

/** Read a build code from the current location hash, if present. */
export function readCodeFromHash(): string | null {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.startsWith(PREFIX)) return null;
  const code = hash.slice(PREFIX.length);
  return code.length > 0 ? code : null;
}

/** Remove the build code from the URL without reloading (after importing). */
export function clearHash(): void {
  const { pathname, search } = window.location;
  window.history.replaceState(null, '', pathname + search);
}
