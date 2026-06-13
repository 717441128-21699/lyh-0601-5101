import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckSquare, SendHorizonal, ClipboardCheck, FileSignature,
  TrendingUp, TrendingDown, AlertTriangle, ArrowRight
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiFetch } from '@/store'

const trendData = [
  { day: '周一', 金额: 12.5 },
  { day: '周二', 金额: 18.2 },
  { day: '周三', 金额: 15.8 },
  { day: '周四', 金额: 22.1 },
  { day: '周五', 金额: 19.6 },
  { day: '周六', 金额: 8.3 },
  { day: '周日', 金额: 5.1 },
]

const mockAlerts = [
  { id: '1', title: '合同HT-2024-015即将到期', severity: 'critical' as const, time: '10分钟前' },
  { id: '2', title: '询价单XJ-2024-023报价截止', severity: 'warning' as const, time: '30分钟前' },
  { id: '3', title: '供应商SP-008资质即将过期', severity: 'warning' as const, time: '1小时前' },
  { id: '4', title: '验收单YS-2024-012超期未处理', severity: 'critical' as const, time: '2小时前' },
  { id: '5', title: '付款节点FK-2024-007已到期', severity: 'warning' as const, time: '3小时前' },
]

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  trend: number
  color: string
  bg: string
}

function StatCard({ icon, label, value, trend, color, bg }: StatCardProps) {
  const isUp = trend > 0
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-emerald-400' : 'text-coral-400'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 font-display">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

interface DashboardData {
  pendingApprovals: number
  pendingQuotes: number
  pendingAcceptance: number
  activeContracts: number
  executionRate: number
  avgResponseTime: number
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    pendingApprovals: 12,
    pendingQuotes: 8,
    pendingAcceptance: 5,
    activeContracts: 36,
    executionRate: 78.5,
    avgResponseTime: 2.3,
  })

  useEffect(() => {
    apiFetch<DashboardData>('/dashboard').then(setData).catch(() => {})
  }, [])

  const radius = 50
  const circumference = 2 * Math.PI * radius
  const progress = (data.executionRate / 100) * circumference

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckSquare className="w-5 h-5" />}
          label="待审批"
          value={data.pendingApprovals}
          trend={8}
          color="text-gold-400"
          bg="bg-gold-50"
        />
        <StatCard
          icon={<SendHorizonal className="w-5 h-5" />}
          label="待报价"
          value={data.pendingQuotes}
          trend={-3}
          color="text-primary-500"
          bg="bg-primary-50"
        />
        <StatCard
          icon={<ClipboardCheck className="w-5 h-5" />}
          label="待验收"
          value={data.pendingAcceptance}
          trend={12}
          color="text-emerald-400"
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<FileSignature className="w-5 h-5" />}
          label="生效合同"
          value={data.activeContracts}
          trend={5}
          color="text-coral-400"
          bg="bg-coral-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-gray-500 mb-4 self-start">采购执行率</h3>
          <div className="relative">
            <svg width="130" height="130" className="-rotate-90">
              <circle cx="65" cy="65" r={radius} fill="none" stroke="#E8EDF4" strokeWidth="10" />
              <circle
                cx="65" cy="65" r={radius} fill="none"
                stroke="#1E3A5F" strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-500 font-display">{data.executionRate}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">较上月提升 2.3%</p>
        </div>

        <div className="card flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-gray-500 mb-4 self-start">平均响应时间</h3>
          <div className="text-center">
            <span className="text-4xl font-bold text-gold-400 font-display">{data.avgResponseTime}</span>
            <span className="text-lg text-gray-500 ml-1">天</span>
          </div>
          <p className="text-sm text-gray-500 mt-3">较上月缩短 0.5天</p>
          <div className="w-full mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gold-400 rounded-full" style={{ width: `${Math.min((data.avgResponseTime / 5) * 100, 100)}%` }} />
            </div>
            <span className="text-xs text-gray-400">目标: 5天</span>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-4">预警通知</h3>
          <div className="space-y-3">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-2 p-2 rounded-md ${
                  alert.severity === 'critical' ? 'bg-coral-50' : 'bg-yellow-50'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  alert.severity === 'critical' ? 'text-coral-400' : 'text-yellow-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{alert.title}</p>
                  <p className="text-xs text-gray-400">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/alerts"
            className="mt-3 text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
          >
            查看全部 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-4">近7天采购量趋势</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} unit="万" />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #f0f0f0', fontSize: '12px' }}
              formatter={(value: number) => [`${value}万元`, '采购金额']}
            />
            <Area type="monotone" dataKey="金额" stroke="#1E3A5F" strokeWidth={2} fill="url(#colorAmount)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
