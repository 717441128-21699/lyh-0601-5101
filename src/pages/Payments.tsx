import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/store'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { Filter, Eye, ChevronRight } from 'lucide-react'

interface PaymentRequest {
  id: string
  contractId: string
  contractTitle: string
  supplier: string
  milestoneName: string
  milestoneId: string
  amount: number
  dueDate: string
  status: 'pending' | 'rejected' | 'paid' | 'processed'
  createdAt: string
  acceptanceId: string
  milestoneStatus: string
  batchNo?: number
}

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待财务处理', color: 'warning' },
  rejected: { label: '已打回', color: 'danger' },
  paid: { label: '已支付', color: 'success' },
  processed: { label: '已支付', color: 'success' },
}

const statusFilters = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待财务处理' },
  { key: 'rejected', label: '已打回' },
  { key: 'paid', label: '已支付' },
  { key: 'milestone_pending', label: '待验收' },
]

export default function Payments() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [milestonesByContract, setMilestonesByContract] = useState<Record<string, any[]>>({})
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedContracts, setExpandedContracts] = useState<Record<string, boolean>>({})

  useEffect(() => {
    apiFetch<any[]>('/payments')
      .then((groups: any[]) => {
        const prs: PaymentRequest[] = []
        const msc: Record<string, any[]> = {}
        groups.forEach((g) => {
          const supplier = g.contract?.supplier_name || ''
          const contractId = g.contract?.id || ''
          const contractTitle = `${supplier}合同`
          msc[contractId] = (g.milestones || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            amount: Number(m.amount),
            dueDate: m.due_date || '',
            status: m.status || 'pending',
          }))
          ;(g.payment_requests || []).forEach((pr: any) => {
            const milestone = pr.milestone || g.milestones?.find((m: any) => m.id === pr.milestone_id)
            prs.push({
              id: pr.id,
              contractId,
              contractTitle,
              supplier,
              milestoneName: pr.milestone?.name || milestone?.name || '',
              milestoneId: pr.milestone_id,
              amount: Number(pr.amount || 0),
              dueDate: pr.milestone?.due_date || milestone?.due_date || pr.created_at?.slice(0, 10) || '',
              status: pr.status || 'pending',
              createdAt: pr.created_at ? pr.created_at.replace('T', ' ').slice(0, 16) : '',
              acceptanceId: pr.acceptance_id,
              milestoneStatus: milestone?.status || 'pending',
              batchNo: pr.acceptance?.batch_no,
            })
          })
        })
        setPaymentRequests(prs)
        setMilestonesByContract(msc)
        const initialExpanded: Record<string, boolean> = {}
        Object.keys(msc).forEach((cid) => { initialExpanded[cid] = true })
        setExpandedContracts(initialExpanded)
      })
      .catch(() => {
        setPaymentRequests([])
        setMilestonesByContract({})
      })
  }, [])

  let filtered = paymentRequests
  if (statusFilter === 'milestone_pending') {
    filtered = paymentRequests.filter((pr) => pr.milestoneStatus === 'pending')
  } else if (statusFilter) {
    filtered = paymentRequests.filter((pr) => pr.status === statusFilter)
  }

  const groupedByContract = filtered.reduce<Record<string, PaymentRequest[]>>((acc, pr) => {
    if (!acc[pr.contractId]) acc[pr.contractId] = []
    acc[pr.contractId].push(pr)
    return acc
  }, {})

  const toggleContract = (contractId: string) => {
    setExpandedContracts((prev) => ({ ...prev, [contractId]: !prev[contractId] }))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-neutral-400" />
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                statusFilter === f.key ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(groupedByContract).length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-12 text-center">
          <p className="text-neutral-500">暂无付款申请记录</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(groupedByContract).map(([contractId, prList]) => {
          const milestones = milestonesByContract[contractId] || []
          const isExpanded = expandedContracts[contractId]
          return (
            <div key={contractId} className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => toggleContract(contractId)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className={cn(
                      "w-4 h-4 text-neutral-400 transition-transform",
                      isExpanded ? "rotate-90" : ""
                    )} />
                    <h3 className="text-base font-semibold text-neutral-900">{prList[0].contractTitle}</h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 ml-6">{contractId} | 供应商: {prList[0].supplier}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono text-neutral-900">
                    申请合计: ¥{prList.reduce((s, pr) => s + pr.amount, 0).toLocaleString()}
                  </span>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    共 {prList.length} 笔申请 · {milestones.length} 个节点
                  </div>
                </div>
              </div>

              {isExpanded && (
                <>
                  {milestones.length > 0 && (
                    <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                      <div className="text-sm font-medium text-neutral-700 mb-3">付款节点进度</div>
                      <div className="relative pl-6">
                        {milestones.map((m, i) => {
                          const relatedPR = prList.find((pr) => pr.milestoneId === m.id)
                          return (
                            <div key={m.id} className="flex gap-4 pb-5 last:pb-0 relative">
                              <div className="absolute left-[-24px] top-0 flex flex-col items-center h-full">
                                <div className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                                  m.status === 'paid' ? 'bg-emerald-500 text-white' :
                                  m.status === 'accepted' ? 'bg-amber-500 text-white' :
                                  'bg-neutral-200 text-neutral-500'
                                )}>
                                  {i + 1}
                                </div>
                                {i < milestones.length - 1 && <div className="w-0.5 flex-1 bg-neutral-200 mt-1" />}
                              </div>
                              <div className="flex-1 flex items-center justify-between py-1">
                                <div>
                                  <p className="text-sm text-neutral-900">{m.name}</p>
                                  <p className="text-xs text-neutral-500">到期: {m.dueDate}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-mono text-neutral-900">¥{m.amount.toLocaleString()}</span>
                                  <StatusBadge
                                    status={m.status === 'paid' ? '已付款' : m.status === 'accepted' ? '已申请' : '待付款'}
                                    color={m.status === 'paid' ? 'success' : m.status === 'accepted' ? 'warning' : 'default'}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {prList.length > 0 && (
                    <div className="border-t border-neutral-100">
                      <div className="px-6 py-3 text-sm font-medium text-neutral-700 bg-neutral-50/30">
                        付款申请记录 ({prList.length})
                      </div>
                      <div className="divide-y divide-neutral-50">
                        {prList.map((pr) => {
                          const statusInfo = paymentStatusLabels[pr.status] || paymentStatusLabels.pending
                          return (
                            <Link
                              key={pr.id}
                              to={`/payments/${pr.id}`}
                              className="px-6 py-4 flex items-center justify-between hover:bg-primary-50/30 transition-colors group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                  {pr.batchNo ? `#${pr.batchNo}` : '1'}
                                </div>
                                <div>
                                  <div className="font-medium text-neutral-900">
                                    {pr.milestoneName}
                                    {pr.batchNo && <span className="text-xs text-neutral-500 ml-2">第{pr.batchNo}批次</span>}
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-0.5">
                                    申请时间: {pr.createdAt}
                                    {pr.acceptanceId && <span className="ml-3">验收单: {pr.acceptanceId}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="font-mono font-semibold text-neutral-900">
                                    ¥{pr.amount.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-0.5">
                                    点击查看详情
                                  </div>
                                </div>
                                <StatusBadge status={statusInfo.label} color={statusInfo.color} />
                                <Eye className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 transition-colors" />
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
