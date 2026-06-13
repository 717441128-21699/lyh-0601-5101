import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'
import { Download, Calendar, X, BarChart3, PieChart as PieChartIcon, Clock, TrendingUp, ChevronRight, FileText, Building2 } from 'lucide-react'
import { API_BASE, apiFetch, useAuthStore, useToastStore } from '@/store'
import { cn } from '@/lib/utils'

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
  { range: '< 3天', count: 12 },
  { range: '3-7天', count: 25 },
  { range: '7-15天', count: 18 },
  { range: '> 15天', count: 3 },
]

const mockSummary = {
  executionRate: 78.5,
  avgResponseTime: 2.3,
  complianceRate: 96.2,
  overdueRate: 3.8,
  activeContracts: 2,
}

interface Statistics {
  deptData?: { name: string; rate: number }[]
  responseData?: { month: string; avgDays: number }[]
  cycleData?: { range: string; count: number }[]
  executionRate?: number
  avgResponseTime?: number
  complianceRate?: number
  overdueRate?: number
  activeContracts?: number
}

interface DrilldownItem {
  id?: string
  supplier_name?: string
  amount?: number
  status?: string
  total_amount?: number
  paid_amount?: number
  remaining_amount?: number
  avg_contract_value?: number
  contracts?: string[]
  month?: string
  contract_count?: number
  compliance_passed?: number
  compliance_failed?: number
  milestone_count?: number
}

interface DrilldownData {
  dimension: string
  range: string | null
  date_range: { start: string | null; end: string | null; firstDate: string; lastDate: string }
  total_count: number
  total_amount: number
  total_paid: number
  items: DrilldownItem[]
  cycle_distribution: { range: string; count: number }[]
}

const dimensions = [
  { key: 'contract', label: '合同维度', icon: FileText },
  { key: 'supplier', label: '供应商维度', icon: Building2 },
  { key: 'month', label: '月度维度', icon: Clock },
]

const PIE_COLORS = ['#1E3A5F', '#D4A843', '#2D9B83', '#E05C5C', '#8B5CF6', '#F97316']

export default function Reports() {
  const token = useAuthStore((s) => s.token)
  const showToast = useToastStore((s) => s.showToast)
  const [dateRange, setDateRange] = useState({ start: '2026-06-07', end: '2026-06-13' })
  const [stats, setStats] = useState<Statistics>({})
  const [exporting, setExporting] = useState<string | null>(null)
  const [activeDimension, setActiveDimension] = useState<'contract' | 'supplier' | 'month'>('contract')
  const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null)
  const [drilldownLoading, setDrilldownLoading] = useState(false)
  const [showDrilldown, setShowDrilldown] = useState(false)
  const [selectedRange, setSelectedRange] = useState<string | null>(null)

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
      const complianceRate = m.compliance_rate !== undefined ? Number(m.compliance_rate) * 100 : undefined
      const overdueRate = m.overdue_rate !== undefined ? Number(m.overdue_rate) * 100 : undefined
      setStats({
        deptData,
        responseData,
        cycleData,
        executionRate,
        avgResponseTime: avgResponseDays,
        complianceRate,
        overdueRate,
        activeContracts: m.active_contracts,
      })
    } catch (e: any) {
      showToast(e.message || '获取统计数据失败', 'error')
    }
  }

  const fetchDrilldown = async (range?: string) => {
    setDrilldownLoading(true)
    setShowDrilldown(true)
    try {
      const params = new URLSearchParams({
        dimension: activeDimension,
        start: dateRange.start,
        end: dateRange.end,
      })
      if (range) params.append('range', range)
      const data: any = await apiFetch(`/reports/drilldown?${params.toString()}`)
      setDrilldownData(data)
      setSelectedRange(range || null)
    } catch (e: any) {
      showToast(e.message || '获取钻取数据失败', 'error')
    } finally {
      setDrilldownLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [dateRange.start, dateRange.end])

  useEffect(() => {
    if (showDrilldown) {
      fetchDrilldown(selectedRange || undefined)
    }
  }, [activeDimension, dateRange.start, dateRange.end])

  const deptData = stats.deptData || mockDeptData
  const responseData = stats.responseData || mockResponseData
  const cycleData = stats.cycleData || mockCycleData
  const summary = {
    executionRate: stats.executionRate ?? mockSummary.executionRate,
    avgResponseTime: stats.avgResponseTime ?? mockSummary.avgResponseTime,
    complianceRate: stats.complianceRate ?? mockSummary.complianceRate,
    overdueRate: stats.overdueRate ?? mockSummary.overdueRate,
    activeContracts: stats.activeContracts ?? mockSummary.activeContracts,
  }

  const pieData = useMemo(() => {
    if (!drilldownData?.items) return []
    if (activeDimension === 'supplier') {
      return drilldownData.items.slice(0, 6).map((item) => ({
        name: item.supplier_name,
        value: Number(item.total_amount || 0),
      }))
    }
    if (activeDimension === 'contract') {
      return drilldownData.items.slice(0, 6).map((item) => ({
        name: item.supplier_name,
        value: Number(item.amount || 0),
      }))
    }
    if (activeDimension === 'month') {
      return drilldownData.items.map((item) => ({
        name: item.month,
        value: Number(item.total_amount || 0),
      }))
    }
    return []
  }, [drilldownData, activeDimension])

  const handleCycleClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const range = data.activePayload[0].payload.range
      fetchDrilldown(range)
    }
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((d) => ({ ...d, start: e.target.value }))}
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-neutral-400">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((d) => ({ ...d, end: e.target.value }))}
              className="px-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => handleExport('pdf')} disabled={!!exporting} className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              {exporting === 'pdf' ? '生成中...' : '导出PDF'}
            </button>
            <button onClick={() => handleExport('excel')} disabled={!!exporting} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              {exporting === 'excel' ? '生成中...' : '导出Excel'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-sm text-neutral-500">采购执行率</span>
          </div>
          <div className="text-3xl font-bold text-neutral-900 font-display">{summary.executionRate}%</div>
          <div className="text-xs text-neutral-400 mt-1">{dateRange.start} ~ {dateRange.end}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm text-neutral-500">平均响应时间</span>
          </div>
          <div className="text-3xl font-bold text-neutral-900 font-display">{summary.avgResponseTime}天</div>
          <div className="text-xs text-neutral-400 mt-1">{dateRange.start} ~ {dateRange.end}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <span className="text-sm text-neutral-500">合同合规率</span>
          </div>
          <div className="text-3xl font-bold text-neutral-900 font-display">{summary.complianceRate}%</div>
          <div className="text-xs text-neutral-400 mt-1">有效合同 {summary.activeContracts} 份</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-sm text-neutral-500">逾期付款率</span>
          </div>
          <div className="text-3xl font-bold text-neutral-900 font-display">{summary.overdueRate}%</div>
          <div className="text-xs text-neutral-400 mt-1">{dateRange.start} ~ {dateRange.end}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-700">各部门采购执行率</h3>
            <span className="text-xs text-neutral-400">单位: %</span>
          </div>
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

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-700">供应商响应时间趋势</h3>
            <span className="text-xs text-neutral-400">单位: 天</span>
          </div>
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

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-neutral-700">合同签署周期分布</h3>
              <p className="text-xs text-neutral-400 mt-0.5">点击柱状图可钻取查看对应明细</p>
            </div>
            <span className="text-xs text-neutral-400">单位: 份</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cycleData} onClick={handleCycleClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                formatter={(v: number) => [`${v}份合同`, '点击查看详情']}
              />
              <Bar
                dataKey="count"
                fill="#2D9B83"
                radius={[4, 4, 0, 0]}
                className="cursor-pointer"
                activeBar={{ fill: '#1E3A5F' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-700">明细钻取</h3>
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              {dimensions.map((dim) => {
                const Icon = dim.icon
                return (
                  <button
                    key={dim.key}
                    onClick={() => {
                      setActiveDimension(dim.key as any)
                      setSelectedRange(null)
                    }}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 text-xs rounded-md transition-all',
                      activeDimension === dim.key
                        ? 'bg-white text-primary-600 shadow-sm font-medium'
                        : 'text-neutral-500 hover:text-neutral-700'
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {dim.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="h-[280px] flex flex-col">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={() => fetchDrilldown()}
                    className="cursor-pointer"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`¥${v.toLocaleString()}`, '金额']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-neutral-400 text-sm">
                点击下方按钮查看明细
              </div>
            )}
            <button
              onClick={() => fetchDrilldown()}
              className="mt-auto w-full py-2.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
            >
              <BarChart3 className="w-4 h-4" />
              查看 {activeDimension === 'contract' ? '合同' : activeDimension === 'supplier' ? '供应商' : '月度'} 明细
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showDrilldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {activeDimension === 'contract' ? '合同明细' : activeDimension === 'supplier' ? '供应商明细' : '月度明细'}
                </h3>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {dateRange.start} ~ {dateRange.end}
                  {selectedRange && <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">周期: {selectedRange}</span>}
                </p>
              </div>
              <button
                onClick={() => setShowDrilldown(false)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {drilldownData && (
              <div className="px-5 py-4 bg-neutral-50 border-b border-neutral-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">
                      {activeDimension === 'month' ? '合同总数' : activeDimension === 'supplier' ? '供应商总数' : '合同总数'}
                    </div>
                    <div className="text-xl font-bold text-neutral-900">{drilldownData.total_count}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">总金额</div>
                    <div className="text-xl font-bold text-primary-600">¥{drilldownData.total_amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">已支付</div>
                    <div className="text-xl font-bold text-emerald-600">¥{drilldownData.total_paid.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">待支付</div>
                    <div className="text-xl font-bold text-amber-600">¥{(drilldownData.total_amount - drilldownData.total_paid).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto p-5">
              {drilldownLoading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full w-8 h-8 border-2 border-primary-500 border-t-transparent"></div>
                </div>
              ) : drilldownData?.items?.length === 0 ? (
                <div className="min-h-[300px] flex items-center justify-center text-neutral-400">
                  暂无数据
                </div>
              ) : activeDimension === 'contract' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-50">
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-left">合同编号</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-left">供应商</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">合同金额</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">已支付</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">待支付</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-center">合规</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-center">付款节点</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {(drilldownData?.items || []).map((item, i) => (
                        <tr key={i} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-neutral-900 font-mono">{item.id}</td>
                          <td className="px-4 py-3 text-sm text-neutral-900">{item.supplier_name}</td>
                          <td className="px-4 py-3 text-sm text-neutral-900 text-right font-mono">¥{Number(item.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-emerald-600 text-right font-mono">¥{Number(item.paid_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-amber-600 text-right font-mono">¥{Number(item.remaining_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                              Number(item.compliance_failed || 0) === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            )}>
                              {item.compliance_passed}/{Number(item.compliance_passed || 0) + Number(item.compliance_failed || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-500 text-center">{item.milestone_count || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/contracts/${item.id}`}
                              className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1"
                            >
                              查看 <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activeDimension === 'supplier' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-50">
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-left">供应商</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">合同数</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">总金额</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">已支付</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">待支付</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">平均合同额</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">合同列表</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {(drilldownData?.items || []).map((item, i) => (
                        <tr key={i} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-neutral-900 font-medium">{item.supplier_name}</td>
                          <td className="px-4 py-3 text-sm text-neutral-900 text-right font-mono">{item.contract_count}</td>
                          <td className="px-4 py-3 text-sm text-neutral-900 text-right font-mono">¥{Number(item.total_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-emerald-600 text-right font-mono">¥{Number(item.paid_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-amber-600 text-right font-mono">¥{Number(item.remaining_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-neutral-500 text-right font-mono">¥{Number(item.avg_contract_value || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                              {(item.contracts || []).slice(0, 3).map((cid) => (
                                <Link
                                  key={cid}
                                  to={`/contracts/${cid}`}
                                  className="text-xs text-primary-600 hover:underline px-1.5 py-0.5 bg-primary-50 rounded"
                                >
                                  {cid}
                                </Link>
                              ))}
                              {(item.contracts || []).length > 3 && (
                                <span className="text-xs text-neutral-400 px-1.5">+{(item.contracts || []).length - 3}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-50">
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-left">月份</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">合同数</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">总金额</th>
                        <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">合同列表</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {(drilldownData?.items || []).map((item, i) => (
                        <tr key={i} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-neutral-900 font-medium">{item.month}</td>
                          <td className="px-4 py-3 text-sm text-neutral-900 text-right font-mono">{item.contract_count}</td>
                          <td className="px-4 py-3 text-sm text-primary-600 text-right font-mono font-semibold">¥{Number(item.total_amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-wrap gap-1 justify-end max-w-[250px]">
                              {(item.contracts || []).slice(0, 3).map((cid) => (
                                <Link
                                  key={cid}
                                  to={`/contracts/${cid}`}
                                  className="text-xs text-primary-600 hover:underline px-1.5 py-0.5 bg-primary-50 rounded"
                                >
                                  {cid}
                                </Link>
                              ))}
                              {(item.contracts || []).length > 3 && (
                                <span className="text-xs text-neutral-400 px-1.5">+{(item.contracts || []).length - 3}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
              <div className="text-sm text-neutral-500">
                共 {drilldownData?.items?.length || 0} 条记录
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDrilldown(false)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-white transition-colors text-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
