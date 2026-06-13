import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { Download, Calendar } from 'lucide-react'
import { API_BASE, apiFetch, useAuthStore, useToastStore } from '@/store'

const mockDeptData = [
  { name: '信息部', rate: 85 },
  { name: '研发部', rate: 72 },
  { name: '行政部', rate: 91 },
  { name: '安全部', rate: 68 },
  { name: '人力资源', rate: 78 },
  { name: '财务部', rate: 95 },
]

const mockResponseData = [
  { month: '7月', avgDays: 3.2 },
  { month: '8月', avgDays: 2.8 },
  { month: '9月', avgDays: 2.5 },
  { month: '10月', avgDays: 2.3 },
  { month: '11月', avgDays: 2.1 },
  { month: '12月', avgDays: 2.3 },
]

const mockCycleData = [
  { range: '1-3天', count: 12 },
  { range: '4-7天', count: 25 },
  { range: '8-14天', count: 18 },
  { range: '15-30天', count: 8 },
  { range: '30天以上', count: 3 },
]

const mockSummary = {
  executionRate: 78.5,
  avgResponseTime: 2.3,
  complianceRate: 96.2,
  overdueRate: 3.8,
}

interface Statistics {
  deptData?: { name: string; rate: number }[]
  responseData?: { month: string; avgDays: number }[]
  cycleData?: { range: string; count: number }[]
  executionRate?: number
  avgResponseTime?: number
  complianceRate?: number
  overdueRate?: number
}

export default function Reports() {
  const token = useAuthStore((s) => s.token)
  const showToast = useToastStore((s) => s.showToast)
  const [dateRange, setDateRange] = useState({ start: '2024-07-01', end: '2024-12-31' })
  const [stats, setStats] = useState<Statistics>({})
  const [exporting, setExporting] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({ start: dateRange.start, end: dateRange.end })
      const json: any = await apiFetch(`/reports/statistics?${params}`)
      const deptData = json.departmentRates
        ? Object.entries(json.departmentRates).map(([name, rate]) => ({ name, rate: rate as number }))
        : undefined
      const responseData = json.responseTrend
        ? (json.responseTrend as any[]).map((r) => ({ month: r.date.slice(5), avgDays: Math.round((r.hours / 24) * 10) / 10 }))
        : undefined
      const cycleData = json.cycleDistribution
      const m = json.metrics || {}
      const execFromMetrics = Number(m.avg_execution_rate)
      const deptVals = Object.values(json.departmentRates || {}) as number[]
      const avgDeptExec = deptVals.length
        ? deptVals.reduce((a, b) => a + b, 0) / deptVals.length
        : 0
      const executionRate = execFromMetrics > 0 ? execFromMetrics : (avgDeptExec > 0 ? avgDeptExec : undefined)
      const avgResponseDays = m.avg_response_hours
        ? Math.round((m.avg_response_hours / 24) * 100) / 100
        : undefined
      const complianceRate = m.compliance_rate !== undefined ? Number(m.compliance_rate) : undefined
      const overdueRate = m.overdue_rate !== undefined ? Number(m.overdue_rate) : undefined
      setStats({
        deptData,
        responseData,
        cycleData,
        executionRate,
        avgResponseTime: avgResponseDays,
        complianceRate,
        overdueRate,
      })
    } catch (e: any) {
      showToast(e.message || '获取统计数据失败', 'error')
    }
  }

  useEffect(() => {
    fetchStats()
  }, [dateRange.start, dateRange.end])

  const deptData = stats.deptData || mockDeptData
  const responseData = stats.responseData || mockResponseData
  const cycleData = stats.cycleData || mockCycleData
  const summary = {
    executionRate: stats.executionRate ?? mockSummary.executionRate,
    avgResponseTime: stats.avgResponseTime ?? mockSummary.avgResponseTime,
    complianceRate: stats.complianceRate ?? mockSummary.complianceRate,
    overdueRate: stats.overdueRate ?? mockSummary.overdueRate,
  }

  const handleExport = async (format: string) => {
    setExporting(format)
    try {
      const params = new URLSearchParams({
        format,
        start: dateRange.start,
        end: dateRange.end,
      })
      const res = await fetch(`${API_BASE}/reports/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        let msg = '导出失败'
        try {
          const contentType = res.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const err = await res.json()
            msg = err.message || msg
          }
        } catch {}
        throw new Error(msg)
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      const ext = format === 'pdf' ? 'pdf' : 'csv'
      a.download = `采购报表_${Date.now()}.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
      showToast('导出成功', 'success')
    } catch (e: any) {
      showToast(e.message || '导出失败', 'error')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((d) => ({ ...d, start: e.target.value }))}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((d) => ({ ...d, end: e.target.value }))}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => handleExport('pdf')} disabled={!!exporting} className="btn-secondary disabled:opacity-50">
              <Download className="w-4 h-4" />
              {exporting === 'pdf' ? '生成中...' : '导出PDF'}
            </button>
            <button onClick={() => handleExport('excel')} disabled={!!exporting} className="btn-primary disabled:opacity-50">
              <Download className="w-4 h-4" />
              {exporting === 'excel' ? '生成中...' : '导出Excel'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-4">各部门采购执行率</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v}%`, '执行率']} />
              <Bar dataKey="rate" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-4">供应商响应时间趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={responseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} unit="天" domain={[0, 5]} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v}天`, '平均响应时间']} />
              <Line type="monotone" dataKey="avgDays" stroke="#D4A843" strokeWidth={2} dot={{ fill: '#D4A843', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-4">合同签署周期分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cycleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v}份`, '合同数']} />
              <Bar dataKey="count" fill="#2D9B83" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-4">关键指标汇总</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
              <span className="text-sm text-gray-700">采购执行率</span>
              <span className="text-lg font-bold text-primary-500 font-display">{summary.executionRate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gold-50 rounded-lg">
              <span className="text-sm text-gray-700">平均响应时间</span>
              <span className="text-lg font-bold text-gold-400 font-display">{summary.avgResponseTime}天</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm text-gray-700">合同合规率</span>
              <span className="text-lg font-bold text-emerald-400 font-display">{summary.complianceRate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-coral-50 rounded-lg">
              <span className="text-sm text-gray-700">逾期付款率</span>
              <span className="text-lg font-bold text-coral-400 font-display">{summary.overdueRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
