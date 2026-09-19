import fs from 'fs'
import path from 'path'
import { parseComponent } from 'vue-template-compiler'
import { constantRoutes } from '../../../mock/role/routes'

const repository = 'https://github.com/Mutantcat-Working-Group/GooseMeeting'
const documents = ['README.md', 'README.en.md', 'LICENSE']

describe('project documentation entries', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../../src/layout/components/Navbar.vue'), 'utf8')
  const template = document.createElement('div')
  template.innerHTML = parseComponent(source).template.content

  it('links to both README languages and the license', () => {
    documents.forEach(file => {
      expect(fs.existsSync(path.resolve(__dirname, '../../../', file))).toBe(true)
      expect(template.querySelector(`a[href="${repository}/blob/master/${file}"]`)).not.toBeNull()
    })
  })

  it('isolates external pages opened by the navbar', () => {
    template.querySelectorAll('a[target="_blank"]').forEach(link => {
      expect(link.rel.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
    })
  })

  it('uses real documentation links instead of a missing mock view', () => {
    const route = constantRoutes.find(route => route.path === '/documentation')
    expect(route.children.map(child => child.path)).toEqual(
      documents.map(file => `${repository}/blob/master/${file}`)
    )
    expect(route.children.every(child => !child.component)).toBe(true)
  })
})
