import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Clock, CheckCircle2, XCircle, Banknote, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch, useToastStore } from '@/store'

interface TimelineItem {
  type: 'submit' | 'approve' | 'reject'
  title: string
  time: string
  user: string
  comment: string
}

interface PaymentDetail {
  id: string
  requestNo: string
  contractId: string
  contractTitle: string
  supplier: string
  contractAmount: number
  milestoneName: string
  milestoneDueDate: string
  amount: number
  status: 'pending' | 'paid' | 'rejected' | 'processed'
  createdAt: string
  processedAt: string
  processedBy: string
  processedComment: string
  comment: string
  acceptanceId: string
  acceptance: any
  contract: any
  milestone: any
  timeline: TimelineItem[]
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待财务处理', color: 'warning' },
  rejected: { label: '已打回', color: 'danger' },
  paid: { label: '已支付', color: 'success' },
  processed: { label: '已支付', color: 'success' },
}

function mapPaymentDetail(pr: any): PaymentDetail {
  return {
    id: pr.id,
    requestNo: pr.requestNo || pr.id,
    contractId: pr.contractId || pr.contract_id,
    contractTitle: pr.contractTitle || `${pr.contract?.supplier_name || ''}合同`,
    supplier: pr.supplier || pr.contract?.supplier_name || '',
    contractAmount: Number(pr.contractAmount || pr.contract?.amount || 0),
    milestoneName: pr.milestoneName || pr.milestone?.name || '',
    milestoneDueDate: pr.milestoneDueDate || pr.milestone?.due_date || '',
    amount: Number(pr.amount || 0),
    status: (pr.status || 'pending') as any,
    createdAt: pr.created_at ? pr.created_at.replace('T', ' ').slice(0, 16) : '',
    processedAt: pr.processed_at ? pr.processed_at.replace('T', ' ').slice(0, 16) : '',
    processedBy: pr.processed_by || '',
    processedComment: pr.processed_comment || '',
    comment: pr.comment || '',
    acceptanceId: pr.acceptance_id || pr.acceptance?.id || '',
    acceptance: pr.acceptance,
    contract: pr.contract,
    milestone: pr.milestone,
    timeline: (pr.timeline || []).map((t: any) => ({
      ...t,
      time: t.time ? t.time.replace('T', ' ').slice(0, 16) : '',
    })),
  }
}

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [detail, setDetail] = useState<PaymentDetail | null>(null)
  const [processComment, setProcessComment] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiFetch<any>(`/payments/${id}`)
      .then((data) => {
        setDetail(mapPaymentDetail(data))
      })
      .catch((err) => {
        showToast(err.message || '获取付款详情失败', 'error')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleProcess = async (action: 'pay' | 'reject') => {
    if (!id || processing) return
    setProcessing(true)
    try {
      const res = await apiFetch<any>(`/payments/${id}/process`, {
        method: 'POST',
        body: JSON.stringify({ action, comment: processComment }),
      })
      showToast(`付款已${action === 'reject' ? '打回' : '支付'}`, 'success')
      setTimeout(() => {
        apiFetch<any>(`/payments/${id}`).then((data) => {
          setDetail(mapPaymentDetail(data))
        })
      }, 300)
    } catch (err: any) {
      showToast(err.message || '处理失败', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-primary-500">
        <div className="animate-spin rounded-full w-8 h-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-neutral-500">
        付款申请不存在
      </div>
    )
  }

  const statusInfo = statusLabels[detail.status] || statusLabels.pending
  const isPending = detail.status === 'pending'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/payments')}
          className="flex items-center gap-2 text-neutral-600 hover:text-primary-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回付款列表
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-neutral-900">付款申请详情</h1>
                <StatusBadge status={statusInfo.label} color={statusInfo.color} />
              </div>
              <p className="text-sm text-neutral-500">
                申请编号：{detail.requestNo} · 申请时间：{detail.createdAt}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-neutral-500 mb-1">申请金额</div>
              <div className="text-3xl font-bold text-primary-600">
                ¥{detail.amount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-neutral-500 mb-1">供应商</div>
              <div className="font-medium text-neutral-900">{detail.supplier}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500 mb-1">关联合同</div>
              <Link
                to={`/contracts/${detail.contractId}`}
                className="font-medium text-primary-600 hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                {detail.contractTitle}
              </Link>
            </div>
            <div>
              <div className="text-sm text-neutral-500 mb-1">合同总金额</div>
              <div className="font-medium text-neutral-900">
                ¥{detail.contractAmount.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-neutral-500 mb-1">付款节点</div>
              <div className="font-medium text-neutral-900">{detail.milestoneName}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500 mb-1">节点到期日</div>
              <div className="font-medium text-neutral-900">{detail.milestoneDueDate}</div>
            </div>
            <div>
              <div className="text-sm text-neutral-500 mb-1">关联验收单</div>
              {detail.acceptanceId ? (
                <Link
                  to={`/acceptance/${detail.acceptanceId}`}
                  className="font-medium text-primary-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  查看验收单 {detail.acceptanceId}
                </Link>
              ) : (
                <div className="font-medium text-neutral-400">无</div>
              )}
            </div>
          </div>
        </div>

        {detail.comment && (
          <div className="px-6 pb-6">
            <div className="bg-neutral-50 rounded-xl p-4">
              <div className="text-sm text-neutral-500 mb-1">申请备注</div>
              <div className="text-neutral-700">{detail.comment}</div>
            </div>
          </div>
        )}

        {detail.processedAt && (
          <div className="px-6 pb-6">
            <div className={cn(
              "rounded-xl p-4",
              detail.status === 'rejected' ? "bg-red-50" : "bg-emerald-50"
            )}>
              <div className="text-sm text-neutral-500 mb-1">
                {detail.status === 'rejected' ? '打回备注' : '支付备注'} · {detail.processedBy} · {detail.processedAt}
              </div>
              <div className="text-neutral-700">{detail.processedComment || '无备注'}</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-neutral-100">
          <h2 className="text-lg font-semibold text-neutral-900">处理时间线</h2>
        </div>
        <div className="p-6">
          <div className="relative">
            {detail.timeline.map((item, idx) => (
              <div key={idx} className="flex gap-4 pb-8 last:pb-0">
                <div className="relative flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    item.type === 'submit' ? "bg-primary-100 text-primary-600" :
                    item.type === 'approve' ? "bg-emerald-100 text-emerald-600" :
                    "bg-red-100 text-red-600"
                  )}>
                    {item.type === 'submit' ? <Clock className="w-5 h-5" /> :
                     item.type === 'approve' ? <CheckCircle2 className="w-5 h-5" /> :
                     <XCircle className="w-5 h-5" />}
                  </div>
                  {idx < detail.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-neutral-200 absolute top-10 left-5 -z-10"></div>
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-neutral-900">{item.title}</h3>
                    <span className="text-sm text-neutral-500">{item.time}</span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">
                    <span className="text-neutral-500">处理人：</span>{item.user}
                  </p>
                  <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2">
                    {item.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isPending && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900">财务处理</h2>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                处理备注
              </label>
              <textarea
                value={processComment}
                onChange={(e) => setProcessComment(e.target.value)}
                placeholder="请输入处理备注（可选）"
                rows={3}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleProcess('reject')}
                disabled={processing}
                className="flex-1 px-6 py-3 border border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4 inline mr-2" />
                打回申请
              </button>
              <button
                onClick={() => handleProcess('pay')}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Banknote className="w-4 h-4 inline mr-2" />
                确认支付
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
