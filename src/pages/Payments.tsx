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

const mockData: Milestone[] = []

const statusFilters = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'accepted', label: '已申请' },
  { key: 'paid', label: '已付款' },
]

export default function Payments() {
  const [data, setData] = useState<Milestone[]>(mockData)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    apiFetch<any[]>('/payments')
      .then((groups: any[]) => {
        const flat: Milestone[] = []
        groups.forEach((g) => {
          const supplier = g.contract?.supplier_name || ''
          const contractId = g.contract?.id || ''
          const contractTitle = `${supplier}合同`
          g.milestones?.forEach((m: any) => {
            flat.push({
              id: m.id,
              contractId,
              contractTitle,
              supplier,
              milestoneName: m.name,
              amount: Number(m.amount),
              dueDate: m.due_date || '',
              status: m.status || 'pending',
            })
          })
          g.payment_requests?.forEach((pr: any) => {
            const existing = flat.find((x) => x.id === pr.milestone_id)
            if (existing && pr.status === 'pending') {
              existing.status = 'accepted'
            }
          })
        })
        if (flat.length) setData(flat.length ? flat : mockData)
      })
      .catch(() => setData(mockData))
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
