import { describe, it, expect } from 'vitest';
import { createSHA256 } from '../hash.js';

describe('helpers/hash', () => {
  it('createSHA256 produces deterministic hex digest', () => {
    const a = createSHA256('hello', 'salt');
    const b = createSHA256('hello', 'salt');
    const c = createSHA256('hello!', 'salt');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});
