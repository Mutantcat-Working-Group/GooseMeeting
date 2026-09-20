const { nativeWindowsVersion, validateTag } = require('../../../scripts/release-version.cjs')

describe('desktop release versions', () => {
  it('preserves the date in Windows four-part numeric limits', () => {
    expect(nativeWindowsVersion('1.0.20260919')).toBe('1.0.2026+919')
    expect(nativeWindowsVersion('1.0.20260920')).toBe('1.0.2026+920')
    expect(nativeWindowsVersion('1.0.20260101')).toBe('1.0.2026+101')
  })
  it.each(['1.0.20260230', '1.0.20261301', '1.0.123', '1.0.20260919-beta', '65536.0.20260919'])('rejects invalid versions %s', version => {
    expect(() => nativeWindowsVersion(version)).toThrow()
  })
  it('only releases the version committed in source', () => {
    expect(validateTag('v1.0.20260919', '1.0.20260919')).toBe('1.0.20260919')
    expect(validateTag('v1.0.20260920', '1.0.20260920')).toBe('1.0.20260920')
    expect(() => validateTag('v1.0.20260920', '1.0.20260919')).toThrow()
  })
})
