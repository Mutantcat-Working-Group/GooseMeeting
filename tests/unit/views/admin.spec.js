import Vue from 'vue'
import Users from '@/views/user/userList.vue'
import Dictionary from '@/views/dictionary/dictionaryList.vue'
import Types from '@/views/dictionary/dictionaryType.vue'
import { fetchList as fetchUsers } from '@/api/systemUser'
import { fetchList as fetchDictionary } from '@/api/dictionary'
import { fetchList as fetchTypes } from '@/api/dictionaryType'
import { export_json_to_excel as exportExcel } from '@/vendor/Export2Excel'

jest.mock('@/api/systemUser', () => ({ fetchList: jest.fn() }))
jest.mock('@/api/dictionary', () => ({ fetchList: jest.fn() }))
jest.mock('@/api/dictionaryType', () => ({ fetchList: jest.fn() }))
jest.mock('@/components/my/DictionarySelect', () => ({}))
jest.mock('@/components/Pagination', () => ({}))
jest.mock('@/vendor/Export2Excel', () => ({ export_json_to_excel: jest.fn() }))

describe('admin list regressions', () => {
  for (const [name, component, fetchList] of [['users', Users, fetchUsers], ['dictionary', Dictionary, fetchDictionary], ['types', Types, fetchTypes]]) {
    it(name + ' clears loading after a failed request', async() => {
      const vm = { ...component.data(), $message: { error: jest.fn() } }
      fetchList.mockRejectedValue(new Error('network'))
      await component.methods.getList.call(vm)
      expect(vm.listLoading).toBe(false)
    })
  }

  for (const [name, component] of [['dictionary', Dictionary], ['types', Types]]) {
    it(name + ' exports real columns and handles an empty list', async() => {
      exportExcel.mockClear()
      const vm = { ...component.data() }
      for (const [key, method] of Object.entries(component.methods)) vm[key] = method.bind(vm)
      vm.$message = { error: jest.fn() }
      vm.list = [{ id: 2, title: 'entry', sort: 1 }]
      await vm.handleDownload()
      const result = exportExcel.mock.calls[0][0]
      expect(result.data[0]).toContain(2)
      expect(result.data[0]).toContain('entry')
      expect(result.header).not.toContain('importance')
      expect(vm.downloadLoading).toBe(false)
      vm.list = null
      await vm.handleDownload()
      expect(vm.downloadLoading).toBe(false)
    })
  }

  it('binds username and nickname filters independently', () => {
    const vm = new (Vue.extend({ ...Users, created: [] }))()
    const tree = vm.$options.render.call(vm)
    const inputs = tree.children[0].children.filter(child => child.data && child.data.attrs && child.data.attrs.placeholder)
    inputs.find(child => child.data.attrs.placeholder === '\u7528\u6237\u540d').data.model.callback('alice')
    expect(vm.listQuery.username).toBe('alice')
    expect(vm.listQuery.nickname).toBeUndefined()
  })
})
