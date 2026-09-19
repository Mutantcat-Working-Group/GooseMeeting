import { normalizeServerUrl, getServerUrl, setServerUrl } from '@/utils/server'

describe('backend configuration', () => {
  beforeEach(() => localStorage.clear())

  it('normalizes and persists a backend path', () => {
    setServerUrl(' https://meeting.example.com/api/ ')
    expect(getServerUrl()).toBe('https://meeting.example.com/api')
  })

  it('allows localhost development servers', () => {
    expect(normalizeServerUrl('http://localhost:8080')).toBe('http://localhost:8080')
  })

  it.each(['', 'javascript:alert(1)', 'https://user:secret@example.com', 'https://example.com?q=1', 'https://example.com/#token', '/api'])('rejects unsafe or ambiguous server %s', value => {
    expect(() => normalizeServerUrl(value)).toThrow()
  })
})
