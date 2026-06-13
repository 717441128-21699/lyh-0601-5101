import { useEffect, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { apiFetch } from '@/store'

interface LogEntry {
  id: string
  timestamp: string
  operator: string
  action: string
  target: string
  detail: string
}

const mockData: LogEntry[] = [
  { id: '1', timestamp: '2024-01-17 14:32:15', operator: '张三', action: '创建', target: '需求 XQ-2024-008', detail: '创建消防器材更换需求' },
  { id: '2', timestamp: '2024-01-17 11:20:08', operator: '李四', action: '提交审批', target: '审批 SP-2024-005', detail: '提交付款申请FK-2024-007审批' },
  { id: '3', timestamp: '2024-01-16 16:45:30', operator: '王五', action: '审批通过', target: '审批 SP-2024-003', detail: '空调设备采购审批通过' },
  { id: '4', timestamp: '2024-01-16 09:15:22', operator: '赵六', action: '驳回', target: '审批 SP-2024-004', detail: '合同签署审批驳回，原因：关联交易未披露' },
  { id: '5', timestamp: '2024-01-15 14:50:11', operator: '系统', action: '预警', target: '合同 HT-2024-015', detail: '合同即将到期，剩余15天' },
  { id: '6', timestamp: '2024-01-15 10:30:45', operator: '张三', action: '发起询价', target: '询价 XJ-2024-006', detail: '音视频系统询价，邀请4家供应商' },
  { id: '7', timestamp: '2024-01-14 15:22:18', operator: '系统', action: '自动评标', target: '询价 XJ-2024-002', detail: '实验室试剂询价自动评标完成，推荐：中联数码' },
  { id: '8', timestamp: '2024-01-14 08:10:05', operator: '李四', action: '上传合同', target: '合同 HT-2024-002', detail: '上传线下合同文件' },
]

const actionTypes = ['全部', '创建', '提交审批', '审批通过', '驳回', '预警', '发起询价', '自动评标', '上传合同']

export default function Logs() {
  const [data, setData] = useState<LogEntry[]>(mockData)
  const [search, setSearch] = useState('')
  const [actionDate, setActionDate] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('')
  const [actionType, setActionType] = useState('全部')

  useEffect(() => {
    apiFetch<LogEntry[]>('/logs').then(setData).catch(() => setData(mockData))
  }, [])

  const filtered = data.filter((r) => {
    if (search && !r.target.includes(search) && !r.detail.includes(search)) return false
    if (operatorFilter && !r.operator.includes(operatorFilter)) return false
    if (actionType !== '全部' && r.action !== actionType) return false
    if (actionDate && !r.timestamp.startsWith(actionDate)) return false
    return true
  })

  const operators = [...new Set(data.map((r) => r.operator))]

  const handleExport = () => {
    window.open('/api/logs/export', '_blank')
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
          <button onClick={handleExport} className="btn-secondary ml-auto">
            <Download className="w-4 h-4" />
            导出
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
            {filtered.map((r) => (
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
