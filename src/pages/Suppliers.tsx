import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, AlertTriangle } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'
import { cn } from '@/lib/utils'

interface Supplier {
  id: string
  name: string
  categories: string[]
  compositeScore: number
  qualificationExpiry: string
  qualificationExpiring: boolean
  cooperationCount: number
}

const mockData: Supplier[] = [
  { id: 'SP-001', name: '华信科技', categories: ['电子设备', '网络设备'], compositeScore: 87.2, qualificationExpiry: '2025-06-30', qualificationExpiring: false, cooperationCount: 12 },
  { id: 'SP-002', name: '中联数码', categories: ['电子设备', '办公用品'], compositeScore: 90.5, qualificationExpiry: '2024-03-15', qualificationExpiring: true, cooperationCount: 8 },
  { id: 'SP-003', name: '联想集团', categories: ['电子设备'], compositeScore: 89.8, qualificationExpiry: '2025-12-31', qualificationExpiring: false, cooperationCount: 15 },
  { id: 'SP-004', name: '戴尔科技', categories: ['电子设备', '服务器'], compositeScore: 86.3, qualificationExpiry: '2025-09-30', qualificationExpiring: false, cooperationCount: 6 },
  { id: 'SP-005', name: '格力电器', categories: ['机电设备'], compositeScore: 92.1, qualificationExpiry: '2025-08-15', qualificationExpiring: false, cooperationCount: 10 },
  { id: 'SP-006', name: '得力文具', categories: ['办公用品'], compositeScore: 78.4, qualificationExpiry: '2024-02-28', qualificationExpiring: true, cooperationCount: 4 },
  { id: 'SP-007', name: '海康威视', categories: ['安全设备', '监控设备'], compositeScore: 91.3, qualificationExpiry: '2025-11-30', qualificationExpiring: false, cooperationCount: 7 },
  { id: 'SP-008', name: '华为技术', categories: ['网络设备', '通信设备'], compositeScore: 93.7, qualificationExpiry: '2024-04-20', qualificationExpiring: true, cooperationCount: 9 },
]

function StarRating({ score }: { score: number }) {
  const stars = Math.round(score / 20)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('w-3.5 h-3.5', i < stars ? 'fill-gold-400 text-gold-400' : 'text-gray-200')}
        />
      ))}
    </div>
  )
}

export default function Suppliers() {
  const [data, setData] = useState<Supplier[]>(mockData)

  useEffect(() => {
    apiFetch<Supplier[]>('/suppliers').then(setData).catch(() => setData(mockData))
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((s) => (
          <Link key={s.id} to={`/suppliers/${s.id}`} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{s.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{s.id}</p>
              </div>
              {s.qualificationExpiring && (
                <AlertTriangle className="w-4 h-4 text-coral-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {s.categories.map((c) => (
                <span key={c} className="px-2 py-0.5 bg-primary-50 text-primary-500 text-xs rounded">{c}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">综合评分</span>
              <div className="flex items-center gap-2">
                <StarRating score={s.compositeScore} />
                <span className="text-sm font-mono font-semibold text-primary-500">{s.compositeScore}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={cn(s.qualificationExpiring ? 'text-coral-400' : 'text-gray-500')}>
                资质到期: {s.qualificationExpiry}
              </span>
              <span className="text-gray-500">合作{ s.cooperationCount}次</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
