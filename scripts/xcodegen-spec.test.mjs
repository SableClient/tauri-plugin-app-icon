import { describe, expect, it } from 'vitest';

import { applySpecIconAliases } from './xcodegen-spec.mjs';

const SPEC = `targets:
  app:
    info:
      path: app_iOS/Info.plist
      properties:
        # APP-ICON ALIASES START
        # APP-ICON ALIASES END
        LSRequiresIPhoneOS: true
`;

describe('applySpecIconAliases', () => {
  it('maps public IDs to generated Xcode asset names at the block indentation', () => {
    const updated = applySpecIconAliases(SPEC, [{ id: 'midnight' }, { id: 'sun_rise' }]);

    expect(updated).toContain(
      '        TauriAppIconAliases:\n          midnight: AppIconMidnight\n          sun_rise: AppIconSunRise\n'
    );
    expect(updated).toContain('        LSRequiresIPhoneOS: true');
  });

  it('refreshes the marked block without duplicating it', () => {
    const once = applySpecIconAliases(SPEC, [{ id: 'midnight' }]);

    expect(applySpecIconAliases(once, [{ id: 'midnight' }])).toBe(once);
    expect(applySpecIconAliases(once, [{ id: 'sunrise' }])).not.toContain('midnight');
  });

  it('requires the marked block', () => {
    expect(() => applySpecIconAliases('targets: {}\n', [{ id: 'midnight' }])).toThrow();
  });
});
