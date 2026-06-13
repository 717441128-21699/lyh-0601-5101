import { create } from 'zustand'

const API_BASE = '/api'

interface User {
  id: string
  username: string
  name: string
  role: string
  department: string
  avatar?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setToken: (token: string) => void
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `请求失败: ${res.status}`)
  }
  return res.json()
}

export { apiFetch, API_BASE }

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: async (username: string, password: string) => {
    const data = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    localStorage.setItem('token', data.token)
    set({ token: data.token, user: data.user, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null, isAuthenticated: false })
  },
  setToken: (token: string) => {
    localStorage.setItem('token', token)
    set({ token, isAuthenticated: true })
  },
}))

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {
    try {
      const data = await apiFetch<Notification[]>('/notifications')
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.read).length,
      })
    } catch {
      set({
        notifications: [
          { id: '1', title: '审批提醒', message: '您有3条待审批事项', type: 'warning', read: false, createdAt: new Date().toISOString() },
          { id: '2', title: '合同到期', message: '合同HT-2024-015将于7天后到期', type: 'error', read: false, createdAt: new Date().toISOString() },
          { id: '3', title: '报价完成', message: '询价单XJ-2024-008已收到全部报价', type: 'success', read: true, createdAt: new Date().toISOString() },
        ],
        unreadCount: 2,
      })
    }
  },
  markAsRead: async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PUT' })
    } catch {}
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    })
  },
  markAllAsRead: async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' })
    } catch {}
    const notifications = get().notifications.map((n) => ({ ...n, read: true }))
    set({ notifications, unreadCount: 0 })
  },
}))
