import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'
import { cn } from '@/lib/utils'

interface AcceptanceItem {
  id: string
  contractId: string
  title: string
  supplier: string
  amount: number
  status: string
  deliveryDate: string
}

const mockData: AcceptanceItem[] = [
  { id: 'YS-2024-001', contractId: 'HT-2024-001', title: '办公电脑验收', supplier: '华信科技', amount: 150000, status: 'pending_acceptance', deliveryDate: '2024-02-05' },
  { id: 'YS-2024-002', contractId: 'HT-2024-002', title: '实验室试剂验收', supplier: '中联数码', amount: 80000, status: 'processing', deliveryDate: '2024-02-10' },
  { id: 'YS-2024-003', contractId: 'HT-2024-003', title: '空调设备验收', supplier: '格力电器', amount: 320000, status: 'accepted', deliveryDate: '2024-02-01' },
  { id: 'YS-2024-004', contractId: 'HT-2024-004', title: '打印纸验收', supplier: '得力文具', amount: 25000, status: 'accepted', deliveryDate: '2024-01-20' },
  { id: 'YS-2024-012', contractId: 'HT-2024-015', title: '网络设备验收', supplier: '华为技术', amount: 560000, status: 'pending_acceptance', deliveryDate: '2024-02-15' },
]

const tabs = [
  { key: '', label: '全部' },
  { key: 'pending_acceptance', label: '待验收' },
  { key: 'processing', label: '验收中' },
  { key: 'accepted', label: '已验收' },
]

export default function Acceptance() {
  const [data, setData] = useState<AcceptanceItem[]>(mockData)
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    apiFetch<AcceptanceItem[]>('/acceptance').then(setData).catch(() => setData(mockData))
  }, [])

  const filtered = data.filter((r) => !activeTab || r.status === activeTab)

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3">
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
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500">验收编号</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">合同编号</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">供应商</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">金额</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">交付日期</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-primary-500">{r.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.title}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.contractId}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.supplier}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">¥{r.amount.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.deliveryDate}</td>
                <td className="px-4 py-3">
                  <Link to={`/acceptance/${r.id}`} className="text-primary-500 hover:text-primary-600 text-sm transition-colors">查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
