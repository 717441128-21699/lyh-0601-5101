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

const mockData: Approval[] = [
  { id: 'SP-2024-001', title: '办公电脑采购审批', type: '采购审批', amount: 150000, status: 'pending', currentStep: 2, totalSteps: 4, submittedBy: '张三', createdAt: '2024-01-16' },
  { id: 'SP-2024-002', title: '实验室试剂审批', type: '采购审批', amount: 80000, status: 'pending', currentStep: 1, totalSteps: 3, submittedBy: '李四', createdAt: '2024-01-15' },
  { id: 'SP-2024-003', title: '空调设备审批', type: '采购审批', amount: 320000, status: 'approved', currentStep: 4, totalSteps: 4, submittedBy: '王五', createdAt: '2024-01-14' },
  { id: 'SP-2024-004', title: '合同HT-2024-015签署审批', type: '合同审批', amount: 560000, status: 'rejected', currentStep: 2, totalSteps: 3, submittedBy: '赵六', createdAt: '2024-01-13' },
  { id: 'SP-2024-005', title: '付款申请FK-2024-007', type: '付款审批', amount: 95000, status: 'pending', currentStep: 1, totalSteps: 2, submittedBy: '钱七', createdAt: '2024-01-12' },
  { id: 'SP-2024-006', title: '打印纸采购审批', type: '采购审批', amount: 25000, status: 'approved', currentStep: 3, totalSteps: 3, submittedBy: '孙八', createdAt: '2024-01-11' },
]

const tabs = [
  { key: 'pending', label: '待我审批' },
  { key: 'approved', label: '我已审批' },
  { key: '', label: '全部' },
]

export default function Approvals() {
  const [data, setData] = useState<Approval[]>(mockData)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    apiFetch<Approval[]>('/approvals').then(setData).catch(() => setData(mockData))
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
