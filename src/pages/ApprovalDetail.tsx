import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch, useToastStore } from '@/store'

interface ApprovalStep {
  step: number
  title: string
  assignee: string
  status: 'completed' | 'current' | 'pending'
  comment?: string
  completedAt?: string
}

interface ApprovalDetail {
  id: string
  title: string
  type: string
  amount: number
  status: string
  currentStep: number
  totalSteps: number
  steps: ApprovalStep[]
  createdAt: string
}

const mockData: ApprovalDetail = {
  id: 'SP-2024-001',
  title: '办公电脑采购审批',
  type: '采购审批',
  amount: 150000,
  status: 'pending',
  currentStep: 2,
  totalSteps: 4,
  createdAt: '2024-01-16',
  steps: [
    { step: 1, title: '部门主管', assignee: '王经理', status: 'completed', comment: '同意', completedAt: '2024-01-16 10:30' },
    { step: 2, title: '采购部门', assignee: '李主管', status: 'current' },
    { step: 3, title: '财务审批', assignee: '赵总监', status: 'pending' },
    { step: 4, title: '总经理', assignee: '刘总', status: 'pending' },
  ],
}

export default function ApprovalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [data, setData] = useState<ApprovalDetail>(mockData)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<ApprovalDetail>(`/approvals/${id}`).then(setData).catch(() => {})
  }, [id])

  const handleAction = async (action: 'approved' | 'rejected') => {
    setError('')
    setSubmitting(true)
    try {
      await apiFetch(`/approvals/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, comment }),
      })
      showToast(action === 'approved' ? '审批通过成功' : '已驳回审批', 'success')
      setTimeout(() => navigate('/approvals'), 500)
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">审批详情</h2>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
            <p className="text-sm text-gray-500 mt-1">编号: {data.id}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">类型：</span><span className="text-gray-900">{data.type}</span></div>
          <div><span className="text-gray-500">金额：</span><span className="text-gray-900 font-mono">¥{data.amount.toLocaleString()}</span></div>
          <div><span className="text-gray-500">提交日期：</span><span className="text-gray-900">{data.createdAt}</span></div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-6">审批流程</h3>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {data.steps.map((step, i) => (
            <div key={step.step} className="flex items-center min-w-[160px]">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium relative',
                    step.status === 'completed' && 'bg-emerald-400 text-white',
                    step.status === 'current' && 'bg-primary-500 text-white animate-pulse',
                    step.status === 'pending' && 'bg-gray-200 text-gray-400'
                  )}
                >
                  {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : step.step}
                  {step.status === 'current' && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold-400 rounded-full border-2 border-white" />
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500">{step.assignee}</p>
                {step.status === 'completed' && step.comment && (
                  <p className="text-xs text-emerald-400 mt-1">{step.comment}</p>
                )}
                {step.status === 'completed' && step.completedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">{step.completedAt}</p>
                )}
              </div>
              {i < data.steps.length - 1 && (
                <div className={cn('flex-1 h-0.5 mt-5 mx-2', step.status === 'completed' ? 'bg-emerald-400' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {data.status === 'pending' && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-3">审批操作</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="请输入审批意见..."
            rows={3}
            className="w-full border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          {error && (
            <div className="mt-3 p-3 bg-coral-50 text-coral-500 text-sm rounded-lg border border-coral-100">
              {error}
            </div>
          )}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => handleAction('approved')}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-emerald-400 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? '提交中...' : '批准'}
            </button>
            <button
              onClick={() => handleAction('rejected')}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-coral-400 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-coral-500 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {submitting ? '提交中...' : '驳回'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
