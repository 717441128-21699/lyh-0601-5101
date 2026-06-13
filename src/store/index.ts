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
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setToken: (token: string) => void
  loadUser: () => Promise<void>
}

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

interface ToastState {
  toasts: ToastItem[]
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  }
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const contentType = res.headers.get('content-type')
  if (!res.ok) {
    let message = `请求失败(${res.status})`
    try {
      if (contentType && contentType.includes('application/json')) {
        const err = await res.json()
        message = err.message || err.error || message
      } else {
        const text = await res.text()
        message = text || message
      }
    } catch {}
    throw new Error(message)
  }
  if (contentType && (contentType.includes('application/pdf') || contentType.includes('text/csv') || contentType.includes('application/octet-stream'))) {
    return res as unknown as T
  }
  const json = await res.json()
  if (json && json.success && json.data !== undefined) {
    return json.data as T
  }
  return json as T
}

export { apiFetch, API_BASE }

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
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
  loadUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ user: null, isAuthenticated: false, loading: false })
      return
    }
    set({ loading: true })
    try {
      const user = await apiFetch<User>('/auth/me')
      set({ user, isAuthenticated: true, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null, isAuthenticated: false, loading: false })
    }
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

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random()
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
