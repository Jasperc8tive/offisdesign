import { generateToken, hashToken } from './token.helper';

describe('token helper', () => {
  it('generates token + matching hash', () => {
    const { raw, hash } = generateToken();
    expect(raw).toHaveLength(43); // 32 bytes base64url
    expect(hash).toHaveLength(64); // sha256 hex
    expect(hashToken(raw)).toBe(hash);
  });

  it('produces a different raw token on each call', () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });
});
