import { useState, useEffect } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard, FileText, SendHorizonal, CheckSquare, FileSignature,
  ClipboardCheck, CreditCard, BarChart3, Users, ScrollText, Bell,
  ChevronRight, LogOut, Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, useNotificationStore } from '@/store'

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/requirements', label: '需求管理', icon: FileText },
  { path: '/inquiries', label: '询价管理', icon: SendHorizonal },
  { path: '/approvals', label: '审批中心', icon: CheckSquare },
  { path: '/contracts', label: '合同管理', icon: FileSignature },
  { path: '/acceptance', label: '验收管理', icon: ClipboardCheck },
  { path: '/payments', label: '付款管理', icon: CreditCard },
  { path: '/reports', label: '统计报表', icon: BarChart3 },
  { path: '/suppliers', label: '供应商管理', icon: Users },
  { path: '/logs', label: '操作日志', icon: ScrollText },
  { path: '/alerts', label: '预警中心', icon: Bell },
]

const breadcrumbMap: Record<string, string> = {
  '/': '工作台',
  '/requirements': '需求管理',
  '/inquiries': '询价管理',
  '/approvals': '审批中心',
  '/contracts': '合同管理',
  '/acceptance': '验收管理',
  '/payments': '付款管理',
  '/reports': '统计报表',
  '/suppliers': '供应商管理',
  '/logs': '操作日志',
  '/alerts': '预警中心',
  '/login': '登录',
}

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; path: string }[] = [{ label: '首页', path: '/' }]
  let current = ''
  for (const part of parts) {
    current += `/${part}`
    crumbs.push({ label: breadcrumbMap[current] || part, path: current })
  }
  return crumbs
}

export default function Layout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { unreadCount, fetchNotifications } = useNotificationStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const breadcrumbs = getBreadcrumbs(location.pathname)
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gold-400 rounded-lg flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-display font-bold text-lg">采管通</span>
        </div>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-6 py-2.5 text-sm transition-colors duration-150',
              isActive(item.path)
                ? 'bg-primary-500/30 text-white border-r-2 border-gold-400'
                : 'text-primary-200 hover:bg-primary-700 hover:text-white'
            )}
          >
            <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-primary-700">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.name || '用户'}</p>
            <p className="text-xs text-primary-300 truncate">{user?.role || '角色'}</p>
          </div>
          <button onClick={logout} className="text-primary-300 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
        </div>
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-primary-800 transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebar}
      </aside>

      <div className={cn('lg:ml-64 min-h-screen flex flex-col', !sidebarOpen && 'lg:ml-64')}>
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
          <button className="lg:hidden text-gray-500" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-500 flex-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="hover:text-primary-500 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </div>
          <Link to="/alerts" className="relative text-gray-400 hover:text-primary-500 transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-coral-400 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 text-sm font-medium">
            {user?.name?.[0] || 'U'}
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
