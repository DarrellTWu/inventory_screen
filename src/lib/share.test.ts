import { describe, it, expect } from 'vitest';
import {
  collectSharedBuild,
  decodeSharedBuild,
  encodeSharedBuild,
  ShareDecodeError,
} from './share';
import { seedState } from '@/data/seed';

const build = seedState.builds[0];

describe('share round-trip', () => {
  it('encodes and decodes a build losslessly (lite)', () => {
    const shared = collectSharedBuild(build, seedState.zones, seedState.items);
    const code = encodeSharedBuild(shared, { lite: true });
    const back = decodeSharedBuild(code);

    expect(back.name).toBe(build.name);
    expect(back.containers).toHaveLength(build.containers.length);
    // every referenced item survives
    expect(back.items.map((i) => i.id).sort()).toEqual(
      shared.items.map((i) => i.id).sort(),
    );
    // container item refs preserved
    const wallet = back.containers.find((c) => c.name === 'Wallet')!;
    expect(wallet.items.map((r) => r.itemId)).toContain('cards');
    expect(wallet.items.find((r) => r.itemId === 'cards')!.quantity).toBe(4);
  });

  it('lite mode strips notes and source URLs', () => {
    const itemWithNotes = {
      ...seedState.items['watch-skx'],
      notes: 'secret',
      sourceUrl: 'https://example.com/x',
    };
    const shared = collectSharedBuild(
      build,
      seedState.zones,
      { ...seedState.items, 'watch-skx': itemWithNotes },
    );
    const lite = decodeSharedBuild(encodeSharedBuild(shared, { lite: true }));
    const watch = lite.items.find((i) => i.id === 'watch-skx')!;
    expect(watch.notes).toBeUndefined();
    expect(watch.sourceUrl).toBeUndefined();
    expect(watch.name).toBe('Seiko SKX007'); // kept

    const full = decodeSharedBuild(encodeSharedBuild(shared, { lite: false }));
    const watchFull = full.items.find((i) => i.id === 'watch-skx')!;
    expect(watchFull.notes).toBe('secret');
    expect(watchFull.sourceUrl).toBe('https://example.com/x');
  });

  it('produces a URL-safe code within reasonable size', () => {
    const shared = collectSharedBuild(build, seedState.zones, seedState.items);
    const code = encodeSharedBuild(shared);
    expect(code).toMatch(/^[A-Za-z0-9+\-$_.!~*'()]+$/);
    expect(code.length).toBeLessThan(4000);
  });

  it('throws a typed error on garbage input', () => {
    expect(() => decodeSharedBuild('not-a-real-code!!!')).toThrow(ShareDecodeError);
    expect(() => decodeSharedBuild('')).toThrow(ShareDecodeError);
  });
});
