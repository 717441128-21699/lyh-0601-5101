import { useEffect, useState } from 'react'
import { Bell, Check, Settings, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { useNotificationStore } from '@/store'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  title: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  read: boolean
  createdAt: string
  source: string
}

const mockAlerts: Alert[] = [
  { id: '1', title: '合同即将到期', message: '合同HT-2024-015（网络设备升级合同）将于7天后到期，请及时处理续签或结项事宜。', severity: 'critical', read: false, createdAt: '2024-01-17 10:30', source: '合同管理' },
  { id: '2', title: '询价报价截止', message: '询价单XJ-2024-023报价截止时间为今日18:00，目前仅收到2/5家供应商报价。', severity: 'warning', read: false, createdAt: '2024-01-17 09:15', source: '询价管理' },
  { id: '3', title: '供应商资质即将过期', message: '供应商SP-008（华为技术）的营业执照将于2024-04-20到期，请提醒供应商更新。', severity: 'warning', read: false, createdAt: '2024-01-16 16:45', source: '供应商管理' },
  { id: '4', title: '验收单超期未处理', message: '验收单YS-2024-012已超过约定验收日期3天，请尽快处理。', severity: 'critical', read: false, createdAt: '2024-01-16 14:20', source: '验收管理' },
  { id: '5', title: '付款节点到期', message: '合同HT-2024-015的预付款节点FK-006将于3天后到期，金额¥224,000。', severity: 'warning', read: true, createdAt: '2024-01-16 08:00', source: '付款管理' },
  { id: '6', title: '审批超时提醒', message: '审批SP-2024-005已在当前节点停留超过48小时，请及时处理。', severity: 'info', read: true, createdAt: '2024-01-15 15:30', source: '审批中心' },
  { id: '7', title: '合规风险提示', message: '合同HT-2024-004涉及关联交易，合规校验未通过，需补充披露材料。', severity: 'critical', read: true, createdAt: '2024-01-14 11:20', source: '合同管理' },
]

const severityIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const severityColors = {
  critical: 'border-l-coral-400 bg-coral-50/30',
  warning: 'border-l-yellow-400 bg-yellow-50/30',
  info: 'border-l-blue-400 bg-blue-50/30',
}

const severityTextColors = {
  critical: 'text-coral-400',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
}

export default function Alerts() {
  const { markAsRead, markAllAsRead } = useNotificationStore()
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {}, [])

  const filtered = filter === 'unread' ? alerts.filter((a) => !a.read) : alerts
  const unreadCount = alerts.filter((a) => !a.read).length

  const handleMarkRead = (id: string) => {
    markAsRead(id)
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a))
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilter('all')}
              className={cn('px-3 py-1.5 text-sm rounded-md transition-colors', filter === 'all' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100')}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn('px-3 py-1.5 text-sm rounded-md transition-colors', filter === 'unread' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100')}
            >
              未读 ({unreadCount})
            </button>
          </div>
          <button onClick={handleMarkAllRead} className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors">
            <Check className="w-3.5 h-3.5" />
            全部标记已读
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => {
          const Icon = severityIcons[alert.severity]
          return (
            <div
              key={alert.id}
              className={cn(
                'card border-l-4 relative',
                severityColors[alert.severity],
                !alert.read && 'ring-1 ring-primary-100'
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', severityTextColors[alert.severity])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn('text-sm font-medium', !alert.read ? 'text-gray-900' : 'text-gray-600')}>{alert.title}</h3>
                    {!alert.read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{alert.createdAt}</span>
                    <span>来源: {alert.source}</span>
                  </div>
                </div>
                {!alert.read && (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    className="text-xs text-primary-500 hover:text-primary-600 flex-shrink-0 transition-colors"
                  >
                    标记已读
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700">预警设置</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-900">合同到期预警</p>
              <p className="text-xs text-gray-500">合同到期前提醒</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">提前</span>
              <input type="number" defaultValue={7} className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center" />
              <span className="text-sm text-gray-600">天</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-900">供应商资质过期预警</p>
              <p className="text-xs text-gray-500">供应商证照过期前提醒</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">提前</span>
              <input type="number" defaultValue={30} className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center" />
              <span className="text-sm text-gray-600">天</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-900">审批超时预警</p>
              <p className="text-xs text-gray-500">审批节点停留超时提醒</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">超过</span>
              <input type="number" defaultValue={48} className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center" />
              <span className="text-sm text-gray-600">小时</span>
            </div>
          </div>
        </div>
        <button className="btn-primary mt-4">保存设置</button>
      </div>
    </div>
  )
}
