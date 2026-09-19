import Cookies from 'js-cookie'
import { isDesktop } from './server'

const TokenKey = 'Admin-Token'

export function getToken() {
  if (isDesktop) return localStorage.getItem(TokenKey)
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  if (isDesktop) return localStorage.setItem(TokenKey, token)
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  if (isDesktop) return localStorage.removeItem(TokenKey)
  return Cookies.remove(TokenKey)
}
