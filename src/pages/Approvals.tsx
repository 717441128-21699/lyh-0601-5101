import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'
import { cn } from '@/lib/utils'
import { Clock, FileText } from 'lucide-react'

interface Approval {
  id: string
  title: string
  type: string
  amount: number
  status: string
  currentStep: number
  totalSteps: number
  submittedBy: string
  createdAt: string
}

const mockData: Approval[] = []

const tabs = [
  { key: 'pending', label: '待我审批' },
  { key: 'approved', label: '我已审批' },
  { key: '', label: '全部' },
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
    amount: Number(a.amount || 0),
    status: a.status || 'pending',
    currentStep: Number(a.current_step || 1),
    totalSteps,
    submittedBy: a.steps?.[0]?.approver_name || '系统提交',
    createdAt: a.created_at ? a.created_at.slice(0, 10) : '',
  }
}

export default function Approvals() {
  const [data, setData] = useState<Approval[]>(mockData)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    apiFetch<any[]>('/approvals')
      .then((list) => setData(list.map(mapApproval)))
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

      <div className="space-y-3">
        {filtered.map((item) => (
          <Link key={item.id} to={`/approvals/${item.id}`} className="card block hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-primary-500" />
                  <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{item.type}</span>
                  <span>申请人: {item.submittedBy}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.createdAt}</span>
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-semibold text-gray-900 font-mono">¥{item.amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              {Array.from({ length: item.totalSteps }).map((_, i) => (
                <div key={i} className="flex-1 flex items-center">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                      i < item.currentStep
                        ? 'bg-emerald-400 text-white'
                        : i === item.currentStep
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    )}
                  >
                    {i + 1}
                  </div>
                  {i < item.totalSteps - 1 && (
                    <div className={cn('flex-1 h-0.5', i < item.currentStep ? 'bg-emerald-400' : 'bg-gray-200')} />
                  )}
                </div>
              ))}
              <span className="ml-2 text-xs text-gray-500">{item.currentStep}/{item.totalSteps}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
