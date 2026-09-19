jest.mock('@/utils/server', () => ({ isDesktop: true, getServerUrl: jest.fn() }))
jest.mock('@/store', () => ({ getters: { token: 'stored' }, dispatch: jest.fn() }))
jest.mock('element-ui', () => ({ Message: jest.fn(), MessageBox: { confirm: jest.fn() } }))

import { getToken, setToken, removeToken } from '@/utils/auth'
import { getServerUrl } from '@/utils/server'
import service from '@/utils/request'

describe('desktop authentication and requests', () => {
  beforeEach(() => localStorage.clear())

  it('stores tokens without depending on cookies on a custom scheme', () => {
    setToken('desktop-token')
    expect(getToken()).toBe('desktop-token')
    removeToken()
    expect(getToken()).toBeNull()
  })

  it('uses the current server for every request', () => {
    setToken('desktop-token')
    getServerUrl.mockReturnValue('https://first.example.com')
    const intercept = service.interceptors.request.handlers[0].fulfilled
    expect(intercept({ headers: {} })).toMatchObject({
      baseURL: 'https://first.example.com',
      headers: { Authorization: 'Bearer desktop-token' }
    })
    getServerUrl.mockReturnValue('https://second.example.com')
    expect(intercept({ headers: {} }).baseURL).toBe('https://second.example.com')
  })

  it('does not send a request to the app origin when no server is configured', async() => {
    getServerUrl.mockReturnValue('')
    const intercept = service.interceptors.request.handlers[0].fulfilled
    await expect(intercept({ headers: {} })).rejects.toThrow()
  })
})
