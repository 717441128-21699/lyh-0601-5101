import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/store'

interface Cooperation {
  id: string
  contractId: string
  title: string
  amount: number
  date: string
  status: string
}

interface SupplierDetail {
  id: string
  name: string
  categories: string[]
  compositeScore: number
  onTimeRate: number
  qualityRate: number
  responseTimeliness: number
  contact: string
  phone: string
  email: string
  address: string
  qualificationExpiry: string
  scoreHistory: { month: string; score: number }[]
  cooperations: Cooperation[]
}

const mockData: SupplierDetail = {
  id: 'SP-003',
  name: '联想集团',
  categories: ['电子设备'],
  compositeScore: 89.8,
  onTimeRate: 92,
  qualityRate: 95,
  responseTimeliness: 85,
  contact: '陈经理',
  phone: '010-5885-8888',
  email: 'chen@lenovo.com',
  address: '北京市海淀区上地创业路6号',
  qualificationExpiry: '2025-12-31',
  scoreHistory: [
    { month: '7月', score: 86.2 },
    { month: '8月', score: 87.5 },
    { month: '9月', score: 88.1 },
    { month: '10月', score: 87.8 },
    { month: '11月', score: 89.2 },
    { month: '12月', score: 89.8 },
  ],
  cooperations: [
    { id: '1', contractId: 'HT-2024-001', title: '办公电脑采购合同', amount: 150000, date: '2024-01-20', status: 'active' },
    { id: '2', contractId: 'HT-2023-018', title: '笔记本电脑采购', amount: 280000, date: '2023-09-15', status: 'completed' },
    { id: '3', contractId: 'HT-2023-012', title: '服务器采购合同', amount: 560000, date: '2023-06-01', status: 'completed' },
    { id: '4', contractId: 'HT-2023-005', title: '台式电脑批量采购', amount: 120000, date: '2023-02-10', status: 'completed' },
  ],
}

interface ScoreBarProps {
  label: string
  value: number
  color: string
}

function ScoreBar({ label, value, color }: ScoreBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-mono font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function SupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<SupplierDetail>(mockData)

  useEffect(() => {
    apiFetch<SupplierDetail>(`/suppliers/${id}`).then(setData).catch(() => {})
  }, [id])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">供应商详情</h2>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{data.name}</h3>
            <p className="text-sm text-gray-500 mt-1">编号: {data.id}</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-primary-500 font-display">{data.compositeScore}</span>
            <p className="text-xs text-gray-500">综合评分</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">联系人：</span><span className="text-gray-900">{data.contact}</span></div>
          <div><span className="text-gray-500">电话：</span><span className="text-gray-900">{data.phone}</span></div>
          <div><span className="text-gray-500">邮箱：</span><span className="text-gray-900">{data.email}</span></div>
          <div className="col-span-2"><span className="text-gray-500">地址：</span><span className="text-gray-900">{data.address}</span></div>
          <div><span className="text-gray-500">资质到期：</span><span className="text-gray-900">{data.qualificationExpiry}</span></div>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {data.categories.map((c) => (
            <span key={c} className="px-2 py-0.5 bg-primary-50 text-primary-500 text-xs rounded">{c}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-4">评分细项</h3>
        <div className="space-y-4">
          <ScoreBar label="准时交付率" value={data.onTimeRate} color="#2D9B83" />
          <ScoreBar label="质量合格率" value={data.qualityRate} color="#1E3A5F" />
          <ScoreBar label="响应及时性" value={data.responseTimeliness} color="#D4A843" />
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-4">评分趋势</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.scoreHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} domain={[80, 95]} />
            <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            <Line type="monotone" dataKey="score" stroke="#1E3A5F" strokeWidth={2} dot={{ fill: '#1E3A5F', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">合作记录</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">合同编号</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">标题</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">金额</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">签约日期</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.cooperations.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5 text-sm font-mono text-primary-500">{c.contractId}</td>
                <td className="px-4 py-2.5 text-sm text-gray-900">{c.title}</td>
                <td className="px-4 py-2.5 text-sm font-mono text-gray-900">¥{c.amount.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{c.date}</td>
                <td className="px-4 py-2.5">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'
                  )}>
                    {c.status === 'active' ? '生效中' : '已完成'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
