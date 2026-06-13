import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'
import { cn } from '@/lib/utils'
import { Clock, FileText, Filter, Search, ChevronDown } from 'lucide-react'

interface Approval {
  id: string
  title: string
  type: string
  rawType: string
  amount: number
  status: string
  currentStep: number
  totalSteps: number
  submittedBy: string
  createdAt: string
}

const mockData: Approval[] = []

const statusTabs = [
  { key: 'pending', label: '待我审批' },
  { key: 'approved', label: '我已审批' },
  { key: 'rejected', label: '已驳回' },
  { key: '', label: '全部' },
]

const typeFilters = [
  { key: 'all', label: '全部类型' },
  { key: 'requirement', label: '采购审批' },
  { key: 'contract', label: '合同审批' },
  { key: 'payment', label: '付款审批' },
]

const stepFilters = [
  { key: 'all', label: '全部节点' },
  { key: '1', label: '第1级审批' },
  { key: '2', label: '第2级审批' },
]

const amountRanges = [
  { key: 'all', label: '全部金额', min: null, max: null },
  { key: '0-10w', label: '10万以下', min: 0, max: 100000 },
  { key: '10w-50w', label: '10-50万', min: 100000, max: 500000 },
  { key: '50w-100w', label: '50-100万', min: 500000, max: 1000000 },
  { key: '100w+', label: '100万以上', min: 1000000, max: null },
]

const typeLabels: Record<string, string> = {
  requirement: '采购审批',
  contract: '合同审批',
  payment: '付款审批',
}

function approvalTitle(a: any): string {
  const typeLabel = typeLabels[a.type] || '审批'
  return `${typeLabel} · ${a.related_id || a.id}`
}

function mapApproval(a: any): Approval {
  const totalSteps = Array.isArray(a.steps) ? a.steps.length : (a.required_level === 'director' ? 2 : 1)
  return {
    id: a.id,
    title: approvalTitle(a),
    type: typeLabels[a.type] || a.type || '审批',
    rawType: a.type,
    amount: Number(a.amount || 0),
    status: a.status || 'pending',
    currentStep: Number(a.current_step || 1),
    totalSteps,
    submittedBy: a.steps?.[0]?.approver_name || '系统提交',
    createdAt: a.created_at ? a.created_at.slice(0, 10) : '',
  }
}

export default function Approvals() {
  const location = useLocation()
  const [data, setData] = useState<Approval[]>(mockData)
  const [activeTab, setActiveTab] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('all')
  const [stepFilter, setStepFilter] = useState('all')
  const [amountFilter, setAmountFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(true)

  const fetchApprovals = useCallback(() => {
    setLoading(true)
    const range = amountRanges.find((r) => r.key === amountFilter)
    const params = new URLSearchParams()
    if (activeTab) params.append('status', activeTab)
    if (typeFilter !== 'all') params.append('type', typeFilter)
    if (stepFilter !== 'all') params.append('current_step', stepFilter)
    if (range?.min !== null) params.append('min_amount', String(range.min))
    if (range?.max !== null) params.append('max_amount', String(range.max))
    apiFetch<any[]>(`/approvals${params.toString() ? '?' + params.toString() : ''}`)
      .then((list) => setData(list.map(mapApproval)))
      .catch(() => setData(mockData))
      .finally(() => setLoading(false))
  }, [activeTab, typeFilter, stepFilter, amountFilter])

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  useEffect(() => {
    if (location.state?.refresh) {
      fetchApprovals()
    }
  }, [location.state, fetchApprovals])

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending: { label: '待审批', color: 'warning' },
    approved: { label: '已通过', color: 'success' },
    rejected: { label: '已驳回', color: 'danger' },
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 text-sm rounded-lg transition-colors',
                  activeTab === tab.key ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {tab.label}
                {tab.key !== '' && (
                  <span className="ml-1 text-xs opacity-80">
                    ({data.filter((d) => d.status === tab.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors',
              showFilters ? 'bg-primary-100 text-primary-600' : 'text-neutral-600 hover:bg-neutral-100'
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">审批类型</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {typeFilters.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">当前节点</label>
              <select
                value={stepFilter}
                onChange={(e) => setStepFilter(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {stepFilters.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5">金额区间</label>
              <select
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {amountRanges.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center text-primary-500">
          <div className="animate-spin rounded-full w-8 h-8 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-12 text-center">
          <p className="text-neutral-500">暂无审批记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) => {
            const sl = statusLabel[item.status] || statusLabel.pending
            return (
              <Link
                key={item.id}
                to={`/approvals/${item.id}`}
                state={{ from: location.pathname }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-100 block hover:shadow-md hover:border-primary-200 transition-all p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary-500" />
                      <h3 className="text-base font-medium text-neutral-900">{item.title}</h3>
                      <StatusBadge status={sl.label} color={sl.color} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 rounded text-neutral-600">
                        {item.type}
                      </span>
                      <span>提交人: {item.submittedBy}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.createdAt}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xl font-bold text-neutral-900 font-mono">¥{item.amount.toLocaleString()}</p>
                    {item.status === 'pending' && (
                      <p className="text-xs text-primary-500 mt-1">当前第 {item.currentStep} 级</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1">
                  {Array.from({ length: item.totalSteps }).map((_, i) => (
                    <div key={i} className="flex-1 flex items-center">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
                          item.status === 'approved'
                            ? 'bg-emerald-500 text-white'
                            : item.status === 'rejected'
                            ? 'bg-red-500 text-white'
                            : i < item.currentStep - 1
                            ? 'bg-emerald-500 text-white'
                            : i === item.currentStep - 1
                            ? 'bg-primary-500 text-white animate-pulse'
                            : 'bg-neutral-200 text-neutral-400'
                        )}
                      >
                        {i + 1}
                      </div>
                      {i < item.totalSteps - 1 && (
                        <div
                          className={cn(
                            'flex-1 h-0.5 mx-1',
                            item.status === 'approved'
                              ? 'bg-emerald-500'
                              : item.status === 'rejected'
                              ? 'bg-red-500'
                              : i < item.currentStep - 1
                              ? 'bg-emerald-500'
                              : 'bg-neutral-200'
                          )}
                        />
                      )}
                    </div>
                  ))}
                  <span className="ml-3 text-xs text-neutral-500 font-mono">
                    {item.status === 'approved' ? `${item.totalSteps}/${item.totalSteps} 已通过` :
                     item.status === 'rejected' ? '已驳回' :
                     `${item.currentStep}/${item.totalSteps}`}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
