import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch, useToastStore } from '@/store'

interface DeliveryItem {
  name: string
  ordered: string
  delivered: string
  match: boolean
}

interface AcceptanceDetail {
  id: string
  contractId: string
  title: string
  supplier: string
  amount: number
  status: string
  deliveryItems: DeliveryItem[]
}

const mockData: AcceptanceDetail = {
  id: '',
  contractId: '',
  title: '',
  supplier: '',
  amount: 0,
  status: 'pending_acceptance',
  deliveryItems: [],
}

function mapAcceptanceStatus(s: string): string {
  if (s === 'completed') return 'accepted'
  return 'pending_acceptance'
}

function normalizeDeliveryItems(items: any[]): DeliveryItem[] {
  if (!items || !items.length) {
    return [
      { name: '交付物核对', ordered: '合同约定清单', delivered: '供应商实际交付', match: true },
    ]
  }
  return items.map((it) => ({
    name: it.name || it.item || '检查项',
    ordered: it.ordered || it.expected || it.requirement || '-',
    delivered: it.delivered || it.actual || it.provided || '-',
    match: typeof it.match === 'boolean' ? it.match : String(it.ordered || it.expected || '') === String(it.delivered || it.actual || ''),
  }))
}

export default function AcceptanceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [data, setData] = useState<AcceptanceDetail>(mockData)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<any>(`/acceptances/${id}`)
      .then((raw: any) => {
        const supplier = raw.contract?.supplier_name || ''
        const msName = raw.milestone?.name || '验收'
        const mapped: AcceptanceDetail = {
          id: raw.id,
          contractId: raw.contract_id,
          title: `${supplier}${msName}`,
          supplier,
          amount: Number(raw.contract?.amount || raw.amount || 0),
          status: mapAcceptanceStatus(raw.status),
          deliveryItems: normalizeDeliveryItems(raw.delivery_items || []),
        }
        setData(mapped)
      })
      .catch(() => {})
  }, [id])

  const handleComplete = async () => {
    setError('')
    setSubmitting(true)
    try {
      await apiFetch(`/acceptances/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ accepted: true }),
      })
      showToast('验收已完成，已生成付款申请', 'success')
      setShowConfirm(false)
      try {
        const updated = await apiFetch<AcceptanceDetail>(`/acceptances/${id}`)
        setData(updated)
      } catch {}
      setTimeout(() => navigate('/payments'), 500)
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const allMatch = data.deliveryItems.every((item) => item.match)
  const canComplete = data.status === 'pending_acceptance' || data.status === 'pending'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">验收详情</h2>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
            <p className="text-sm text-gray-500 mt-1">编号: {data.id} | 合同: {data.contractId} | 供应商: {data.supplier}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <div className="text-sm">
          <span className="text-gray-500">合同金额：</span>
          <span className="text-gray-900 font-mono">¥{data.amount.toLocaleString()}</span>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">交付物对比</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">项目</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">订单要求</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">实际交付</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">结果</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.deliveryItems.map((item, i) => (
              <tr key={i} className={cn(!item.match && 'bg-coral-50/30')}>
                <td className="px-4 py-2.5 text-sm text-gray-900 font-medium">{item.name}</td>
                <td className="px-4 py-2.5 text-sm text-gray-700">{item.ordered}</td>
                <td className="px-4 py-2.5 text-sm text-gray-700">{item.delivered}</td>
                <td className="px-4 py-2.5">
                  {item.match ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-coral-400" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canComplete && (
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowConfirm(true); setError('') }} className="btn-primary">
            <CreditCard className="w-4 h-4" />
            完成验收
          </button>
          {!allMatch && (
            <span className="text-xs text-coral-400">注意：存在交付物与订单不一致项，完成验收后将自动生成付款申请</span>
          )}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认完成验收</h3>
            <p className="text-sm text-gray-500 mb-4">
              完成验收后将自动生成付款申请，合同 {data.contractId} 的待付款项将进入付款流程。
            </p>
            {error && (
              <div className="mb-4 p-3 bg-coral-50 text-coral-500 text-sm rounded-lg border border-coral-100">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary" disabled={submitting}>取消</button>
              <button onClick={handleComplete} disabled={submitting} className="btn-primary disabled:opacity-50">
                {submitting ? '处理中...' : '确认完成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
