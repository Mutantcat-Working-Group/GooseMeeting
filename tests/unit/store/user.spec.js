import user from '@/store/modules/user'
import { getInfo } from '@/api/user'
import { resetRouter } from '@/router'

jest.mock('@/api/user', () => ({ getInfo: jest.fn() }))
jest.mock('@/utils/auth', () => ({ getToken: jest.fn(), setToken: jest.fn(), removeToken: jest.fn() }))
jest.mock('@/router', () => ({ __esModule: true, default: { addRoutes: jest.fn() }, resetRouter: jest.fn() }))

describe('user state validation', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each([null, { roles: [] }, { roles: 'admin' }])('does not commit invalid user data: %p', async data => {
    const commit = jest.fn()
    getInfo.mockResolvedValue({ data })
    await expect(user.actions.getInfo({ commit, state: { token: 'token' } })).rejects.toBeDefined()
    expect(commit).not.toHaveBeenCalled()
  })

  it('resets previously authorized routes when the token is cleared', async() => {
    await user.actions.resetToken({ commit: jest.fn() })
    expect(resetRouter).toHaveBeenCalled()
  })

  it('propagates role change failures', async() => {
    const error = new Error('denied')
    await expect(user.actions.changeRoles({ commit: jest.fn(), dispatch: jest.fn().mockRejectedValue(error) }, 'admin')).rejects.toBe(error)
  })
})
