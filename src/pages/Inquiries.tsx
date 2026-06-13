import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'
import { cn } from '@/lib/utils'

interface Inquiry {
  id: string
  title: string
  department: string
  supplierCount: number
  quoteCount: number
  status: string
  deadline: string
  createdAt: string
}

const mockData: Inquiry[] = [
  { id: 'XJ-2024-001', title: '办公电脑询价', department: '信息部', supplierCount: 5, quoteCount: 3, status: 'quoting', deadline: '2024-01-25', createdAt: '2024-01-16' },
  { id: 'XJ-2024-002', title: '实验室试剂询价', department: '研发部', supplierCount: 4, quoteCount: 4, status: 'evaluated', deadline: '2024-01-22', createdAt: '2024-01-14' },
  { id: 'XJ-2024-003', title: '空调设备询价', department: '行政部', supplierCount: 3, quoteCount: 0, status: 'sent', deadline: '2024-01-28', createdAt: '2024-01-15' },
  { id: 'XJ-2024-004', title: '打印纸询价', department: '行政部', supplierCount: 6, quoteCount: 6, status: 'closed', deadline: '2024-01-18', createdAt: '2024-01-10' },
  { id: 'XJ-2024-005', title: '安全设备询价', department: '安全部', supplierCount: 3, quoteCount: 0, status: 'draft', deadline: '2024-02-01', createdAt: '2024-01-17' },
  { id: 'XJ-2024-006', title: '音视频系统询价', department: '行政部', supplierCount: 4, quoteCount: 2, status: 'quoting', deadline: '2024-01-30', createdAt: '2024-01-16' },
]

const tabs = [
  { key: '', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'sent', label: '已发送' },
  { key: 'quoting', label: '报价中' },
  { key: 'evaluated', label: '已评标' },
  { key: 'closed', label: '已关闭' },
]

export default function Inquiries() {
  const [data, setData] = useState<Inquiry[]>(mockData)
  const [activeTab, setActiveTab] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiFetch<Inquiry[]>('/inquiries').then(setData).catch(() => setData(mockData))
  }, [])

  const filtered = data.filter((r) => {
    if (activeTab && r.status !== activeTab) return false
    if (search && !r.title.includes(search) && !r.id.includes(search)) return false
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
                activeTab === tab.key
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索询价单..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500">询价编号</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">部门</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">供应商</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">已报价</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">截止日期</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-primary-500">{r.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.department}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.supplierCount}家</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.quoteCount}/{r.supplierCount}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.deadline}</td>
                <td className="px-4 py-3">
                  <Link to={`/inquiries/${r.id}`} className="text-primary-500 hover:text-primary-600 text-sm transition-colors">查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
