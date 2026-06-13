import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Eye, SendHorizonal } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'

interface Requirement {
  id: string
  title: string
  department: string
  category: string
  budget: number
  status: string
  createdAt: string
}

const mockData: Requirement[] = [
  { id: 'XQ-2024-001', title: '办公电脑采购', department: '信息部', category: '电子设备', budget: 150000, status: 'pending', createdAt: '2024-01-15' },
  { id: 'XQ-2024-002', title: '实验室试剂采购', department: '研发部', category: '实验耗材', budget: 80000, status: 'in_inquiry', createdAt: '2024-01-14' },
  { id: 'XQ-2024-003', title: '空调设备更换', department: '行政部', category: '机电设备', budget: 320000, status: 'in_approval', createdAt: '2024-01-13' },
  { id: 'XQ-2024-004', title: '打印纸批量采购', department: '行政部', category: '办公用品', budget: 25000, status: 'contracted', createdAt: '2024-01-12' },
  { id: 'XQ-2024-005', title: '网络安全设备升级', department: '信息部', category: '电子设备', budget: 500000, status: 'completed', createdAt: '2024-01-11' },
  { id: 'XQ-2024-006', title: '员工工服定制', department: '人力资源部', category: '服装纺织', budget: 60000, status: 'pending', createdAt: '2024-01-10' },
  { id: 'XQ-2024-007', title: '会议室音视频系统', department: '行政部', category: '电子设备', budget: 200000, status: 'in_inquiry', createdAt: '2024-01-09' },
  { id: 'XQ-2024-008', title: '消防器材更换', department: '安全部', category: '安全设备', budget: 45000, status: 'draft', createdAt: '2024-01-08' },
]

export default function Requirements() {
  const [data, setData] = useState<Requirement[]>(mockData)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    apiFetch<Requirement[]>('/requirements').then(setData).catch(() => setData(mockData))
  }, [])

  const filtered = data.filter((r) => {
    if (search && !r.title.includes(search) && !r.id.includes(search)) return false
    if (deptFilter && r.department !== deptFilter) return false
    if (categoryFilter && r.category !== categoryFilter) return false
    if (statusFilter && r.status !== statusFilter) return false
    return true
  })

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)
  const departments = [...new Set(data.map((r) => r.department))]
  const categories = [...new Set(data.map((r) => r.category))]

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索需求编号或标题..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部部门</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部品类</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="pending">待处理</option>
            <option value="in_inquiry">询价中</option>
            <option value="in_approval">审批中</option>
            <option value="contracted">已签约</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500">需求编号</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">标题</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">部门</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">品类</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">预算</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">创建日期</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-primary-500">{r.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.department}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.category}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-mono">¥{r.budget.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link to={`/requirements/${r.id}`} className="text-primary-500 hover:text-primary-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </Link>
                    {(r.status === 'pending' || r.status === 'draft') && (
                      <Link to={`/inquiries?from=${r.id}`} className="text-emerald-400 hover:text-emerald-500 transition-colors">
                        <SendHorizonal className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">共 {filtered.length} 条</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-sm rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-50">上一页</button>
              <span className="px-3 py-1 text-sm text-gray-600">{page}/{totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-50">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
