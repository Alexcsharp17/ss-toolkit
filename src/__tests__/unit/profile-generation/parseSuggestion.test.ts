import { parseProfileGenerationJson } from '../../../profile-generation/parseSuggestion';

describe('parseProfileGenerationJson', () => {
  it('parses plain JSON', () => {
    const r = parseProfileGenerationJson('{"firstName":"Anna","lastName":"Ivanova","bio":"Hello","username":"anna_iv_7"}');
    expect(r).toEqual({ firstName: 'Anna', lastName: 'Ivanova', bio: 'Hello', username: 'anna_iv_7' });
  });

  it('parses fenced JSON', () => {
    const r = parseProfileGenerationJson('```json\n{"firstName":"X","lastName":"","bio":"Y","username":""}\n```');
    expect(r).toEqual({ firstName: 'X', lastName: '', bio: 'Y', username: '' });
  });

  it('returns null for missing firstName or bio', () => {
    expect(parseProfileGenerationJson('{"firstName":"","lastName":"A","bio":"b"}')).toBeNull();
    expect(parseProfileGenerationJson('{"firstName":"A","lastName":"B"}')).toBeNull();
  });

  it('clamps long bio to Telegram default (70)', () => {
    const long = 'x'.repeat(600);
    const r = parseProfileGenerationJson(JSON.stringify({ firstName: 'A', lastName: 'B', bio: long, username: 'ab_cd12' }));
    expect(r?.bio.length).toBe(70);
    expect(r?.username).toBe('ab_cd12');
  });

  it('clamps long bio to custom maxBioLength', () => {
    const long = 'y'.repeat(600);
    const r = parseProfileGenerationJson(JSON.stringify({ firstName: 'A', lastName: 'B', bio: long, username: 'ab_cd12' }), {
      maxBioLength: 120,
    });
    expect(r?.bio.length).toBe(120);
  });

  it('sanitizes username and defaults empty when omitted', () => {
    const r = parseProfileGenerationJson('{"firstName":"A","lastName":"","bio":"b","username":"Bad-Name!"}');
    expect(r?.username).toMatch(/^[a-z0-9_]{5,32}$/);
    const noUser = parseProfileGenerationJson('{"firstName":"A","lastName":"","bio":"b"}');
    expect(noUser?.username).toBe('');
  });
});
