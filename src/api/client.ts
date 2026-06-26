const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export function getTokens() {
  return {
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token'),
  }
}

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const { refresh } = getTokens()
    if (!refresh) return false
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (!res.ok) {
        clearTokens()
        return false
      }
      const data = await res.json()
      saveTokens(data.access_token, data.refresh_token)
      return true
    } catch {
      clearTokens()
      return false
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { access } = getTokens()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (access) headers['Authorization'] = `Bearer ${access}`

  let res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (res.status === 401) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      const { access: newAccess } = getTokens()
      if (newAccess) headers['Authorization'] = `Bearer ${newAccess}`
      res = await fetch(`${BASE}${path}`, { ...init, headers })
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error((err as { detail?: string }).detail ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export { BASE }
