import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Upload } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'
import { cn } from '@/lib/utils'

interface Contract {
  id: string
  title: string
  supplier: string
  amount: number
  status: string
  signingStatus: string
  complianceStatus: string
  startDate: string
  endDate: string
}

const mockData: Contract[] = [
  { id: 'HT-2024-001', title: '办公电脑采购合同', supplier: '华信科技', amount: 150000, status: 'active', signingStatus: 'signed', complianceStatus: 'passed', startDate: '2024-01-20', endDate: '2024-07-20' },
  { id: 'HT-2024-002', title: '实验室试剂供应合同', supplier: '中联数码', amount: 80000, status: 'signing', signingStatus: 'pending', complianceStatus: 'checking', startDate: '2024-01-25', endDate: '2024-06-25' },
  { id: 'HT-2024-003', title: '空调设备维保合同', supplier: '格力电器', amount: 320000, status: 'active', signingStatus: 'signed', complianceStatus: 'passed', startDate: '2024-02-01', endDate: '2025-01-31' },
  { id: 'HT-2024-004', title: '打印纸供应合同', supplier: '得力文具', amount: 25000, status: 'completed', signingStatus: 'signed', complianceStatus: 'passed', startDate: '2023-06-01', endDate: '2024-01-15' },
  { id: 'HT-2024-005', title: '安全监控设备合同', supplier: '海康威视', amount: 450000, status: 'draft', signingStatus: 'unsigned', complianceStatus: 'pending', startDate: '', endDate: '' },
  { id: 'HT-2024-015', title: '网络设备升级合同', supplier: '华为技术', amount: 560000, status: 'active', signingStatus: 'signed', complianceStatus: 'warning', startDate: '2023-08-01', endDate: '2024-07-31' },
]

const tabs = [
  { key: '', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'signing', label: '签署中' },
  { key: 'active', label: '生效中' },
  { key: 'completed', label: '已完成' },
  { key: 'voided', label: '已作废' },
]

const complianceLabels: Record<string, string> = { passed: '合规', checking: '校验中', pending: '待校验', warning: '有风险' }
const signingLabels: Record<string, string> = { signed: '已签署', pending: '待签署', unsigned: '未签署' }

export default function Contracts() {
  const [data, setData] = useState<Contract[]>(mockData)
  const [activeTab, setActiveTab] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiFetch<Contract[]>('/contracts').then(setData).catch(() => setData(mockData))
  }, [])

  const filtered = data.filter((r) => {
    if (activeTab && r.status !== activeTab) return false
    if (search && !r.title.includes(search) && !r.id.includes(search) && !r.supplier.includes(search)) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                activeTab === tab.key ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索合同..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Link to="/contracts/upload" className="btn-primary">
            <Upload className="w-4 h-4" />
            上传线下合同
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500">合同编号</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">供应商</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">金额</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">合规</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">签署</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-primary-500">{r.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.supplier}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">¥{r.amount.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium', r.complianceStatus === 'passed' ? 'text-emerald-400' : r.complianceStatus === 'warning' ? 'text-coral-400' : 'text-gray-500')}>
                    {complianceLabels[r.complianceStatus] || r.complianceStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-600">{signingLabels[r.signingStatus] || r.signingStatus}</span>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/contracts/${r.id}`} className="text-primary-500 hover:text-primary-600 text-sm transition-colors">查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
