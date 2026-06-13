import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { Download, Calendar } from 'lucide-react'

const deptData = [
  { name: '信息部', rate: 85 },
  { name: '研发部', rate: 72 },
  { name: '行政部', rate: 91 },
  { name: '安全部', rate: 68 },
  { name: '人力资源', rate: 78 },
  { name: '财务部', rate: 95 },
]

const responseData = [
  { month: '7月', avgDays: 3.2 },
  { month: '8月', avgDays: 2.8 },
  { month: '9月', avgDays: 2.5 },
  { month: '10月', avgDays: 2.3 },
  { month: '11月', avgDays: 2.1 },
  { month: '12月', avgDays: 2.3 },
]

const cycleData = [
  { range: '1-3天', count: 12 },
  { range: '4-7天', count: 25 },
  { range: '8-14天', count: 18 },
  { range: '15-30天', count: 8 },
  { range: '30天以上', count: 3 },
]

export default function Reports() {
  const [dateRange, setDateRange] = useState({ start: '2024-07-01', end: '2024-12-31' })

  const handleExport = (format: string) => {
    window.open(`/api/reports/export?format=${format}&start=${dateRange.start}&end=${dateRange.end}`, '_blank')
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
            <button onClick={() => handleExport('pdf')} className="btn-secondary">
              <Download className="w-4 h-4" />
              导出PDF
            </button>
            <button onClick={() => handleExport('excel')} className="btn-primary">
              <Download className="w-4 h-4" />
              导出Excel
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
              <span className="text-lg font-bold text-primary-500 font-display">78.5%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gold-50 rounded-lg">
              <span className="text-sm text-gray-700">平均响应时间</span>
              <span className="text-lg font-bold text-gold-400 font-display">2.3天</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm text-gray-700">合同合规率</span>
              <span className="text-lg font-bold text-emerald-400 font-display">96.2%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-coral-50 rounded-lg">
              <span className="text-sm text-gray-700">逾期付款率</span>
              <span className="text-lg font-bold text-coral-400 font-display">3.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
