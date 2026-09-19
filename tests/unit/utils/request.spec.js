import service from '@/utils/request'
import { MessageBox } from 'element-ui'
import store from '@/store'

jest.mock('element-ui', () => ({ Message: jest.fn(), MessageBox: { confirm: jest.fn() } }))
jest.mock('@/store', () => ({ getters: {}, dispatch: jest.fn() }))
jest.mock('@/utils/auth', () => ({ getToken: jest.fn() }))

describe('expired session prompt', () => {
  it('handles dialog cancellation while still rejecting the failed API request', async() => {
    const cancelHandled = jest.fn()
    MessageBox.confirm.mockReturnValue({ then: jest.fn(() => ({ catch: cancelHandled })) })
    const responseHandler = service.interceptors.response.handlers[0].fulfilled
    await expect(responseHandler({ data: { code: 432, message: 'expired' } })).rejects.toThrow('expired')
    expect(cancelHandled).toHaveBeenCalled()
    expect(store.dispatch).not.toHaveBeenCalled()
  })
})
