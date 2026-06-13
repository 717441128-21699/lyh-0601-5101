import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, SendHorizonal, X } from 'lucide-react'
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
  description: string
  specifications: { name: string; value: string; unit: string }[]
}

const mockReq: Requirement = {
  id: 'XQ-2024-001',
  title: '办公电脑采购',
  department: '信息部',
  category: '电子设备',
  budget: 150000,
  status: 'pending',
  createdAt: '2024-01-15',
  description: '为信息部及各部门采购办公用台式电脑，需满足日常办公及轻度开发需求。',
  specifications: [
    { name: 'CPU', value: 'Intel i5-13400 或同等', unit: '-' },
    { name: '内存', value: '16', unit: 'GB' },
    { name: '硬盘', value: '512', unit: 'GB SSD' },
    { name: '显示器', value: '23.8', unit: '英寸' },
    { name: '数量', value: '30', unit: '台' },
  ],
}

const mockSuppliers = [
  { id: 'SP-001', name: '华信科技' },
  { id: 'SP-002', name: '中联数码' },
  { id: 'SP-003', name: '联想集团' },
  { id: 'SP-004', name: '戴尔科技' },
  { id: 'SP-005', name: '方正信息' },
]

export default function RequirementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Requirement>(mockReq)
  const [showModal, setShowModal] = useState(false)
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])

  useEffect(() => {
    apiFetch<Requirement>(`/requirements/${id}`).then(setData).catch(() => {})
  }, [id])

  const toggleSupplier = (sid: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(sid) ? prev.filter((s) => s !== sid) : [...prev, sid]
    )
  }

  const handleConvert = () => {
    apiFetch('/inquiries', {
      method: 'POST',
      body: JSON.stringify({ requirementId: id, supplierIds: selectedSuppliers }),
    })
      .then(() => navigate('/inquiries'))
      .catch(() => navigate('/inquiries'))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">需求详情</h2>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
            <p className="text-sm text-gray-500 mt-1">编号: {data.id}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">部门：</span><span className="text-gray-900">{data.department}</span></div>
          <div><span className="text-gray-500">品类：</span><span className="text-gray-900">{data.category}</span></div>
          <div><span className="text-gray-500">预算：</span><span className="text-gray-900 font-mono">¥{data.budget.toLocaleString()}</span></div>
          <div><span className="text-gray-500">创建日期：</span><span className="text-gray-900">{data.createdAt}</span></div>
        </div>
        <p className="mt-4 text-sm text-gray-600">{data.description}</p>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-3">规格参数</h3>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-xs font-medium text-gray-500 text-left">参数名称</th>
              <th className="px-4 py-2 text-xs font-medium text-gray-500 text-left">参数值</th>
              <th className="px-4 py-2 text-xs font-medium text-gray-500 text-left">单位</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.specifications.map((spec, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                <td className="px-4 py-2 text-sm text-gray-900">{spec.name}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{spec.value}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{spec.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(data.status === 'pending' || data.status === 'draft') && (
        <button onClick={() => setShowModal(true)} className="btn-gold">
          <SendHorizonal className="w-4 h-4" />
          转为询价
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">选择供应商</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mockSuppliers.map((s) => (
                <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSuppliers.includes(s.id)}
                    onChange={() => toggleSupplier(s.id)}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-900">{s.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">{s.id}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
              <button
                onClick={handleConvert}
                disabled={selectedSuppliers.length === 0}
                className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认发起询价
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
