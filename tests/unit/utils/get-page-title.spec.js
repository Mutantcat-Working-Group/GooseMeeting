import getPageTitle from '@/utils/get-page-title'
import settings from '@/settings'
import SidebarLogo from '@/layout/components/Sidebar/Logo.vue'
import { name as packageName } from '../../../package.json'

describe('goosemeeting branding', () => {
  it('uses the organization namespace for the package name', () => {
    expect(packageName).toBe('org.mutantcat.goosemeeting')
  })

  it('uses the Chinese product name for default and route titles', () => {
    expect(getPageTitle()).toBe('大鹅会议')
    expect(getPageTitle('会议')).toBe('会议 - 大鹅会议')
  })

  it('shares the configured title with the sidebar', () => {
    expect(SidebarLogo.data().title).toBe(settings.title)
  })
})
