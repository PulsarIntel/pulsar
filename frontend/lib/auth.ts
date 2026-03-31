export interface User {
  id: string
  name: string
  email: string
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function isTokenExpired(): boolean {
  const token = getToken()
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    if (!payload.exp) return false
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

export function isLoggedIn(): boolean {
  return !!getToken() && !isTokenExpired()
}

export function ensureAuth(): boolean {
  if (isTokenExpired()) {
    logout()
    return false
  }
  return isLoggedIn()
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("user")
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/"
}

export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
