import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Legend
} from 'recharts'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'

interface Quote {
  supplierId: string
  supplierName: string
  price: number
  delivery: number
  quality: number
  service: number
  qualification: number
  compositeScore: number
}

interface InquiryDetail {
  id: string
  title: string
  department: string
  status: string
  deadline: string
  requirementId: string
  quotes: Quote[]
}

const mockData: InquiryDetail = {
  id: 'XJ-2024-001',
  title: '办公电脑询价',
  department: '信息部',
  status: 'evaluated',
  deadline: '2024-01-25',
  requirementId: 'XQ-2024-001',
  quotes: [
    { supplierId: 'SP-001', supplierName: '华信科技', price: 4800, delivery: 7, quality: 88, service: 85, qualification: 95, compositeScore: 87.2 },
    { supplierId: 'SP-002', supplierName: '中联数码', price: 5100, delivery: 5, quality: 92, service: 90, qualification: 90, compositeScore: 90.5 },
    { supplierId: 'SP-003', supplierName: '联想集团', price: 4650, delivery: 10, quality: 95, service: 82, qualification: 98, compositeScore: 89.8 },
    { supplierId: 'SP-004', supplierName: '戴尔科技', price: 5200, delivery: 8, quality: 90, service: 88, qualification: 92, compositeScore: 86.3 },
  ],
}

const radarLabels = [
  { key: 'price', label: '价格', fullMark: 100 },
  { key: 'delivery', label: '交付', fullMark: 100 },
  { key: 'quality', label: '质量', fullMark: 100 },
  { key: 'service', label: '服务', fullMark: 100 },
  { key: 'qualification', label: '资质', fullMark: 100 },
]

function normalizeQuotes(quotes: Quote[]) {
  const minPrice = Math.min(...quotes.map((q) => q.price))
  const maxDelivery = Math.max(...quotes.map((q) => q.delivery))
  return quotes.map((q) => ({
    ...q,
    priceScore: Math.round(((minPrice / q.price) * 100) * 10) / 10,
    deliveryScore: Math.round(((1 - (q.delivery / (maxDelivery * 1.5))) * 100 + 50) * 10) / 10,
  }))
}

const RADAR_COLORS = ['#1E3A5F', '#D4A843', '#2D9B83']

export default function InquiryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<InquiryDetail>(mockData)

  useEffect(() => {
    apiFetch<InquiryDetail>(`/inquiries/${id}`).then(setData).catch(() => {})
  }, [id])

  const normalized = normalizeQuotes(data.quotes)
  const top3 = normalized.slice(0, 3)
  const radarData = radarLabels.map((dim) => {
    const row: Record<string, string | number> = { dimension: dim.label }
    top3.forEach((q) => {
      const val = dim.key === 'price' ? q.priceScore : dim.key === 'delivery' ? q.deliveryScore : q[dim.key as keyof Quote] as number
      row[q.supplierName] = val
    })
    return row
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">询价详情</h2>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
            <p className="text-sm text-gray-500 mt-1">编号: {data.id} | 关联需求: {data.requirementId}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">部门：</span><span className="text-gray-900">{data.department}</span></div>
          <div><span className="text-gray-500">截止日期：</span><span className="text-gray-900">{data.deadline}</span></div>
          <div><span className="text-gray-500">报价数：</span><span className="text-gray-900">{data.quotes.length}家</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-4">供应商雷达图 (Top 3)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              {top3.map((q, i) => (
                <Radar key={q.supplierId} name={q.supplierName} dataKey={q.supplierName} stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-4">综合评分排名</h3>
          <div className="space-y-4">
            {[...data.quotes].sort((a, b) => b.compositeScore - a.compositeScore).map((q, i) => (
              <div key={q.supplierId}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-gold-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-300'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-900">{q.supplierName}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-primary-500">{q.compositeScore}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${q.compositeScore}%`,
                      backgroundColor: i === 0 ? '#D4A843' : i === 1 ? '#9CA3AF' : '#1E3A5F',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">报价对比明细</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">供应商</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">单价</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">交期(天)</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">质量分</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">服务分</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">资质分</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500 text-left">综合分</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.quotes.map((q) => (
              <tr key={q.supplierId} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5 text-sm text-gray-900">{q.supplierName}</td>
                <td className="px-4 py-2.5 text-sm font-mono text-gray-900">¥{q.price.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{q.delivery}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{q.quality}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{q.service}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{q.qualification}</td>
                <td className="px-4 py-2.5 text-sm font-mono font-semibold text-primary-500">{q.compositeScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
