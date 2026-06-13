import { useEffect, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { API_BASE, apiFetch, useAuthStore, useToastStore } from '@/store'

interface LogEntry {
  id: string
  timestamp: string
  operator: string
  action: string
  target: string
  detail: string
}

const actionTypes = ['全部', '创建需求', '创建询价', '审批通过', '驳回', '生成预警', '发起询价', '自动评标', '上传合同', '创建合同', '签署合同', '完成验收', '处理付款', '用户登录']

export default function Logs() {
  const token = useAuthStore((s) => s.token)
  const showToast = useToastStore((s) => s.showToast)
  const [data, setData] = useState<LogEntry[]>([])
  const [search, setSearch] = useState('')
  const [actionDate, setActionDate] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('')
  const [actionType, setActionType] = useState('全部')
  const [exporting, setExporting] = useState(false)

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('target', search)
      if (actionDate) params.append('date', actionDate)
      if (operatorFilter) params.append('operator', operatorFilter)
      if (actionType && actionType !== '全部') params.append('action', actionType)
      const query = params.toString()
      const url = `/logs${query ? `?${query}` : ''}`
      const list: any[] = await apiFetch(url)
      const mapped: LogEntry[] = list.map((l) => ({
        id: l.id,
        timestamp: l.timestamp.replace('T', ' ').slice(0, 19),
        operator: l.operator_name,
        action: l.action,
        target: l.target_id ? `${l.target_type} ${l.target_id}` : l.target_type,
        detail: l.detail,
      }))
      setData(mapped)
    } catch (e: any) {
      showToast(e.message || '获取日志失败', 'error')
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [search, actionDate, operatorFilter, actionType])

  const operators = [...new Set(data.map((r) => r.operator))]

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (actionDate) params.append('start', actionDate)
      const query = params.toString()
      const url = `${API_BASE}/reports/logs/export${query ? `?${query}` : ''}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('导出失败')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `操作日志_${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
      showToast('导出成功', 'success')
    } catch (e: any) {
      showToast(e.message || '导出失败', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索目标或详情..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <input
            type="date"
            value={actionDate}
            onChange={(e) => setActionDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部操作人</option>
            {operators.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {actionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={handleExport} disabled={exporting} className="btn-secondary ml-auto disabled:opacity-50">
            <Download className="w-4 h-4" />
            {exporting ? '导出中...' : '导出'}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500">时间</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">操作人</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">操作</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">目标</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">{r.timestamp}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.operator}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    r.action === '驳回' ? 'bg-coral-50 text-coral-500' :
                    r.action === '预警' ? 'bg-yellow-50 text-yellow-700' :
                    r.action === '审批通过' ? 'bg-emerald-50 text-emerald-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {r.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-primary-500 font-mono">{r.target}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
