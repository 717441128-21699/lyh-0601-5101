import { useEffect, useState } from 'react'
import { apiFetch } from '@/store'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { Filter } from 'lucide-react'

interface Milestone {
  id: string
  contractId: string
  contractTitle: string
  supplier: string
  milestoneName: string
  amount: number
  dueDate: string
  status: string
}

const mockData: Milestone[] = [
  { id: 'FK-001', contractId: 'HT-2024-001', contractTitle: '办公电脑采购合同', supplier: '华信科技', milestoneName: '预付款(30%)', amount: 45000, dueDate: '2024-01-25', status: 'paid' },
  { id: 'FK-002', contractId: 'HT-2024-001', contractTitle: '办公电脑采购合同', supplier: '华信科技', milestoneName: '到货款(50%)', amount: 75000, dueDate: '2024-02-15', status: 'payment_requested' },
  { id: 'FK-003', contractId: 'HT-2024-001', contractTitle: '办公电脑采购合同', supplier: '华信科技', milestoneName: '质保金(20%)', amount: 30000, dueDate: '2024-07-20', status: 'pending' },
  { id: 'FK-004', contractId: 'HT-2024-003', contractTitle: '空调设备维保合同', supplier: '格力电器', milestoneName: '首付款(50%)', amount: 160000, dueDate: '2024-02-05', status: 'paid' },
  { id: 'FK-005', contractId: 'HT-2024-003', contractTitle: '空调设备维保合同', supplier: '格力电器', milestoneName: '尾款(50%)', amount: 160000, dueDate: '2024-03-05', status: 'pending' },
  { id: 'FK-006', contractId: 'HT-2024-015', contractTitle: '网络设备升级合同', supplier: '华为技术', milestoneName: '预付款(40%)', amount: 224000, dueDate: '2024-02-01', status: 'payment_requested' },
  { id: 'FK-007', contractId: 'HT-2024-015', contractTitle: '网络设备升级合同', supplier: '华为技术', milestoneName: '到货款(40%)', amount: 224000, dueDate: '2024-03-01', status: 'pending' },
  { id: 'FK-008', contractId: 'HT-2024-015', contractTitle: '网络设备升级合同', supplier: '华为技术', milestoneName: '质保金(20%)', amount: 112000, dueDate: '2024-08-01', status: 'pending' },
]

const statusFilters = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'payment_requested', label: '已申请' },
  { key: 'paid', label: '已付款' },
]

export default function Payments() {
  const [data, setData] = useState<Milestone[]>(mockData)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    apiFetch<Milestone[]>('/payments').then(setData).catch(() => setData(mockData))
  }, [])

  const filtered = data.filter((r) => !statusFilter || r.status === statusFilter)

  const grouped = filtered.reduce<Record<string, Milestone[]>>((acc, m) => {
    if (!acc[m.contractId]) acc[m.contractId] = []
    acc[m.contractId].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                statusFilter === f.key ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([contractId, milestones]) => (
          <div key={contractId} className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{milestones[0].contractTitle}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{contractId} | 供应商: {milestones[0].supplier}</p>
              </div>
              <span className="text-sm font-mono text-gray-500">
                合计: ¥{milestones.reduce((s, m) => s + m.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="relative pl-6">
              {milestones.map((m, i) => (
                <div key={m.id} className="flex gap-4 pb-5 last:pb-0 relative">
                  <div className="absolute left-[-24px] top-0 flex flex-col items-center h-full">
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                      m.status === 'paid' ? 'bg-emerald-400 text-white' :
                      m.status === 'payment_requested' ? 'bg-gold-400 text-white' :
                      'bg-gray-200 text-gray-400'
                    )}>
                      {i + 1}
                    </div>
                    {i < milestones.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between py-1">
                    <div>
                      <p className="text-sm text-gray-900">{m.milestoneName}</p>
                      <p className="text-xs text-gray-500">到期: {m.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-gray-900">¥{m.amount.toLocaleString()}</span>
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
