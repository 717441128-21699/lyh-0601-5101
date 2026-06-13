import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Clock, FileText, User } from 'lucide-react'
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
  action?: 'approved' | 'rejected' | 'pending'
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
  timeline: TimelineItem[]
}

interface TimelineItem {
  type: 'submit' | 'approve' | 'reject' | 'pending'
  title: string
  time: string
  user: string
  comment: string
  step?: number
}

const mockData: ApprovalDetail = {
  id: '',
  title: '',
  type: '审批',
  amount: 0,
  status: 'pending',
  currentStep: 1,
  totalSteps: 1,
  createdAt: '',
  steps: [],
  timeline: [],
}

const typeLabels: Record<string, string> = {
  requirement: '采购审批',
  contract: '合同审批',
  payment: '付款审批',
}
const roleLabels: Record<string, string> = {
  manager: '部门经理审批',
  director: '总监理审批',
}

function buildTimeline(a: any, steps: ApprovalStep[]): TimelineItem[] {
  const timeline: TimelineItem[] = []
  timeline.push({
    type: 'submit',
    title: '审批发起',
    time: a.created_at ? a.created_at.replace('T', ' ').slice(0, 16) : '',
    user: steps[0]?.assignee || '系统',
    comment: `提交${typeLabels[a.type] || '审批'}申请，金额 ¥${Number(a.amount || 0).toLocaleString()}`,
    step: 0,
  })
  steps.forEach((s) => {
    if (s.status === 'completed') {
      timeline.push({
        type: s.action === 'rejected' ? 'reject' : 'approve',
        title: s.action === 'rejected' ? '审批驳回' : '审批通过',
        time: s.completedAt || '',
        user: s.assignee,
        comment: s.comment || (s.action === 'rejected' ? '审批驳回' : '审批通过'),
        step: s.step,
      })
    } else if (s.status === 'current') {
      timeline.push({
        type: 'pending',
        title: '待审批',
        time: '',
        user: s.assignee,
        comment: '等待处理中...',
        step: s.step,
      })
    }
  })
  return timeline
}

function mapApprovalDetail(a: any): ApprovalDetail {
  const totalSteps = Array.isArray(a.steps) ? a.steps.length : (a.required_level === 'director' ? 2 : 1)
  const typeLabel = typeLabels[a.type] || a.type || '审批'
  const steps: ApprovalStep[] = (a.steps || []).map((s: any) => {
    let stepStatus: 'completed' | 'current' | 'pending' = 'pending'
    let action: 'approved' | 'rejected' | 'pending' = 'pending'
    if (s.status === 'approved') {
      stepStatus = 'completed'
      action = 'approved'
    } else if (s.status === 'rejected') {
      stepStatus = 'completed'
      action = 'rejected'
    } else if (s.step === a.current_step && a.status === 'pending') {
      stepStatus = 'current'
    }
    const actedAt = s.acted_at ? s.acted_at.replace('T', ' ').slice(0, 16) : undefined
    return {
      step: s.step,
      title: roleLabels[s.role] || `第${s.step}级审批`,
      assignee: s.approver_name || '-',
      status: stepStatus,
      action,
      comment: s.comment || undefined,
      completedAt: actedAt,
    }
  })
  return {
    id: a.id,
    title: `${typeLabel} · ${a.related_id || a.id}`,
    type: typeLabel,
    amount: Number(a.amount || 0),
    status: a.status || 'pending',
    currentStep: Number(a.current_step || 1),
    totalSteps,
    createdAt: a.created_at ? a.created_at.replace('T', ' ').slice(0, 16) : '',
    steps,
    timeline: buildTimeline(a, steps),
  }
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
    apiFetch<any>(`/approvals/${id}`)
      .then((raw) => setData(mapApprovalDetail(raw)))
      .catch(() => {})
  }, [id])

  const handleAction = async (action: 'approved' | 'rejected') => {
    setError('')
    setSubmitting(true)
    try {
      const res = await apiFetch<any>(`/approvals/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, comment }),
      })
      showToast(action === 'approved' ? '审批通过成功' : '已驳回审批', 'success')
      setData(mapApprovalDetail(res))
      setTimeout(() => navigate('/approvals', { state: { refresh: true } }), 800)
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const statusInfo: Record<string, { label: string; color: string }> = {
    pending: { label: '待审批', color: 'warning' },
    approved: { label: '已通过', color: 'success' },
    rejected: { label: '已驳回', color: 'danger' },
  }
  const si = statusInfo[data.status] || statusInfo.pending

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-neutral-900">审批详情</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-semibold text-neutral-900">{data.title}</h3>
                <StatusBadge status={si.label} color={si.color} />
              </div>
              <p className="text-sm text-neutral-500">
                编号: {data.id} · 提交时间: {data.createdAt}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-neutral-500 mb-1">申请金额</div>
              <div className="text-3xl font-bold text-primary-600">
                ¥{data.amount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div>
            <div className="text-sm text-neutral-500 mb-1">审批类型</div>
            <div className="font-medium text-neutral-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              {data.type}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-500 mb-1">当前进度</div>
            <div className="font-medium text-neutral-900">
              {data.status === 'approved' ? `${data.totalSteps}/${data.totalSteps} 已通过` :
               data.status === 'rejected' ? '已驳回' :
               `第 ${data.currentStep} 级 / 共 ${data.totalSteps} 级`}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-500 mb-1">提交时间</div>
            <div className="font-medium text-neutral-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              {data.createdAt}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="text-sm font-medium text-neutral-700 mb-4">审批流程</div>
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {data.steps.map((step, i) => (
              <div key={step.step} className="flex items-center min-w-[180px]">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium relative',
                      step.status === 'completed' && step.action === 'approved' && 'bg-emerald-500 text-white',
                      step.status === 'completed' && step.action === 'rejected' && 'bg-red-500 text-white',
                      step.status === 'current' && 'bg-primary-500 text-white animate-pulse',
                      step.status === 'pending' && 'bg-neutral-200 text-neutral-400'
                    )}
                  >
                    {step.status === 'completed' && step.action === 'approved' ? <CheckCircle2 className="w-6 h-6" /> :
                     step.status === 'completed' && step.action === 'rejected' ? <XCircle className="w-6 h-6" /> :
                     step.step}
                    {step.status === 'current' && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <p className="mt-3 text-sm font-medium text-neutral-900">{step.title}</p>
                  <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3" />
                    {step.assignee}
                  </p>
                  {step.status === 'completed' && step.comment && (
                    <div className="mt-2 px-3 py-2 bg-neutral-50 rounded-lg text-xs text-neutral-600 max-w-[160px]">
                      {step.comment}
                    </div>
                  )}
                  {step.status === 'completed' && step.completedAt && (
                    <p className="text-xs text-neutral-400 mt-1">{step.completedAt}</p>
                  )}
                  {step.status === 'current' && (
                    <p className="text-xs text-primary-500 mt-1 animate-pulse">等待处理...</p>
                  )}
                </div>
                {i < data.steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mt-6 mx-2',
                    step.status === 'completed' ? 'bg-emerald-500' : 'bg-neutral-200'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-6 border-b border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-900">处理时间线</h3>
        </div>
        <div className="p-6">
          <div className="relative">
            {data.timeline.map((item, idx) => (
              <div key={idx} className="flex gap-4 pb-8 last:pb-0">
                <div className="relative flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    item.type === 'submit' ? "bg-primary-100 text-primary-600" :
                    item.type === 'approve' ? "bg-emerald-100 text-emerald-600" :
                    item.type === 'reject' ? "bg-red-100 text-red-600" :
                    "bg-neutral-100 text-neutral-500"
                  )}>
                    {item.type === 'submit' ? <FileText className="w-5 h-5" /> :
                     item.type === 'approve' ? <CheckCircle2 className="w-5 h-5" /> :
                     item.type === 'reject' ? <XCircle className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  {idx < data.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-neutral-200 absolute top-10 left-5 -z-10"></div>
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-neutral-900">{item.title}</h3>
                    {item.time && <span className="text-sm text-neutral-500">{item.time}</span>}
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

      {data.status === 'pending' && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <h3 className="text-lg font-semibold text-neutral-900">审批操作</h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">审批意见</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请输入审批意见..."
                rows={3}
                className="w-full border border-neutral-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction('rejected')}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 border border-red-500 text-red-600 px-5 py-3 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4" />
                {submitting ? '提交中...' : '驳回'}
              </button>
              <button
                onClick={() => handleAction('approved')}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? '提交中...' : '批准'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
