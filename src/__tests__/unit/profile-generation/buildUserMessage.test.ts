import { TELEGRAM_PROFILE_BIO_MAX_LENGTH } from '../../../profile-generation/constants';
import { buildProfileGenerationUserMessage } from '../../../profile-generation/prompts';

describe('buildProfileGenerationUserMessage', () => {
  const hints = { gender: 'female', countryPreset: 'US' };

  it('includes partial-regeneration instructions when regenerateOnly and lockedProfile are set', () => {
    const msg = buildProfileGenerationUserMessage({
      hints,
      regenerateOnly: 'bio',
      lockedProfile: { firstName: 'Ann', lastName: 'Lee', bio: 'Old bio', username: 'ann_lee' },
    });
    expect(msg).toContain('Regenerate ONLY bio');
    expect(msg).toContain('firstName: Ann');
    expect(msg).toContain('lastName: Lee');
    expect(msg).toContain('bio: Old bio');
    expect(msg).toContain('username: ann_lee');
    expect(msg).toContain('firstName, lastName, and username MUST equal');
    expect(msg).toContain('Bio character limit');
  });

  it('uses full-generation wording when regenerateOnly is omitted', () => {
    const msg = buildProfileGenerationUserMessage({ hints });
    expect(msg).toContain('Generate firstName, lastName, bio, and username for this persona');
    expect(msg).not.toContain('Regenerate ONLY');
    expect(msg).toContain('Bio character limit');
    expect(msg).toContain(String(TELEGRAM_PROFILE_BIO_MAX_LENGTH));
  });
});
