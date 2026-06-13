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

const mockData: AcceptanceItem[] = []

const tabs = [
  { key: '', label: '全部' },
  { key: 'pending_acceptance', label: '待验收' },
  { key: 'accepted', label: '已验收' },
]

function mapAcceptanceStatus(s: string): string {
  if (s === 'completed') return 'accepted'
  return 'pending_acceptance'
}

export default function Acceptance() {
  const [data, setData] = useState<AcceptanceItem[]>(mockData)
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    apiFetch<any[]>('/acceptances')
      .then((list: any[]) => {
        const mapped: AcceptanceItem[] = list.map((a) => {
          const supplier = a.contract?.supplier_name || ''
          const msName = a.milestone?.name || '验收'
          return {
            id: a.id,
            contractId: a.contract_id,
            title: `${supplier}${msName}`,
            supplier,
            amount: Number(a.contract?.amount || a.amount || 0),
            status: mapAcceptanceStatus(a.status),
            deliveryDate: a.milestone?.due_date || (a.created_at ? a.created_at.slice(0, 10) : ''),
          }
        })
        setData(mapped.length ? mapped : mockData)
      })
      .catch(() => setData(mockData))
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
