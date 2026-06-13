import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Upload } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'
import { cn } from '@/lib/utils'

interface Contract {
  id: string
  title: string
  supplier: string
  amount: number
  status: string
  signingStatus: string
  complianceStatus: string
  startDate: string
  endDate: string
}

const mockData: Contract[] = []

const tabs = [
  { key: '', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'signing', label: '签署中' },
  { key: 'active', label: '生效中' },
  { key: 'completed', label: '已完成' },
  { key: 'voided', label: '已作废' },
]

const complianceLabels: Record<string, string> = { passed: '合规', checking: '校验中', pending: '待校验', warning: '有风险' }
const signingLabels: Record<string, string> = { signed: '已签署', pending: '待签署', unsigned: '未签署' }

function mapContract(c: any): Contract {
  const supplier = c.supplier_name || ''
  let signingStatus = 'unsigned'
  if (c.signed_at) signingStatus = 'signed'
  else if (c.effective_from || c.status === 'signing') signingStatus = 'pending'
  let complianceStatus = 'pending'
  const passed = Number(c.compliance_passed || 0)
  const failed = Number(c.compliance_failed || 0)
  if (passed > 0 && failed === 0) complianceStatus = 'passed'
  else if (failed > 0) complianceStatus = 'warning'
  else if (passed > 0 && failed > 0) complianceStatus = 'checking'
  return {
    id: c.id,
    title: `${supplier}合同`,
    supplier,
    amount: Number(c.amount || 0),
    status: c.status || 'draft',
    signingStatus,
    complianceStatus,
    startDate: c.effective_from || '',
    endDate: c.effective_to || '',
  }
}

export default function Contracts() {
  const [data, setData] = useState<Contract[]>(mockData)
  const [activeTab, setActiveTab] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiFetch<any[]>('/contracts')
      .then((list) => setData(list.map(mapContract)))
      .catch(() => setData(mockData))
  }, [])

  const filtered = data.filter((r) => {
    if (activeTab && r.status !== activeTab) return false
    if (search && !r.title.includes(search) && !r.id.includes(search) && !r.supplier.includes(search)) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-4">
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
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索合同..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Link to="/contracts/upload" className="btn-primary">
            <Upload className="w-4 h-4" />
            上传线下合同
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500">合同编号</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">供应商</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">金额</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">合规</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">签署</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-primary-500">{r.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.supplier}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-900">¥{r.amount.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium', r.complianceStatus === 'passed' ? 'text-emerald-400' : r.complianceStatus === 'warning' ? 'text-coral-400' : 'text-gray-500')}>
                    {complianceLabels[r.complianceStatus] || r.complianceStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-600">{signingLabels[r.signingStatus] || r.signingStatus}</span>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/contracts/${r.id}`} className="text-primary-500 hover:text-primary-600 text-sm transition-colors">查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
