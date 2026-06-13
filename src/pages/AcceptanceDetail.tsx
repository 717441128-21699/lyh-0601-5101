import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'

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
  id: 'YS-2024-001',
  contractId: 'HT-2024-001',
  title: '办公电脑验收',
  supplier: '华信科技',
  amount: 150000,
  status: 'pending_acceptance',
  deliveryItems: [
    { name: '品牌型号', ordered: '联想 ThinkCentre M930t', delivered: '联想 ThinkCentre M930t', match: true },
    { name: 'CPU', ordered: 'Intel i5-13400', delivered: 'Intel i5-13400', match: true },
    { name: '内存', ordered: '16GB DDR4', delivered: '16GB DDR4', match: true },
    { name: '硬盘', ordered: '512GB SSD', delivered: '256GB SSD', match: false },
    { name: '显示器', ordered: '23.8英寸 IPS', delivered: '23.8英寸 IPS', match: true },
    { name: '数量', ordered: '30台', delivered: '28台', match: false },
  ],
}

export default function AcceptanceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<AcceptanceDetail>(mockData)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    apiFetch<AcceptanceDetail>(`/acceptance/${id}`).then(setData).catch(() => {})
  }, [id])

  const handleComplete = async () => {
    setSubmitting(true)
    try {
      await apiFetch(`/acceptance/${id}/complete`, { method: 'POST' })
      navigate('/payments')
    } catch {
      navigate('/payments')
    } finally {
      setSubmitting(false)
    }
  }

  const allMatch = data.deliveryItems.every((item) => item.match)

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

      {data.status === 'pending_acceptance' && (
        <div className="flex items-center gap-3">
          <button onClick={() => setShowConfirm(true)} className="btn-primary">
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
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary">取消</button>
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
