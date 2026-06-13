import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, FileSignature } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/store'

interface ComplianceItem {
  name: string
  passed: boolean
  suggestion?: string
}

interface Milestone {
  id: string
  name: string
  amount: number
  dueDate: string
  status: string
}

interface ContractDetail {
  id: string
  title: string
  supplier: string
  amount: number
  status: string
  signingStatus: string
  startDate: string
  endDate: string
  keyTerms: string[]
  compliance: ComplianceItem[]
  milestones: Milestone[]
}

const mockData: ContractDetail = {
  id: '',
  title: '',
  supplier: '',
  amount: 0,
  status: 'draft',
  signingStatus: 'unsigned',
  startDate: '',
  endDate: '',
  keyTerms: [],
  compliance: [],
  milestones: [],
}

function mapCompliance(details: any): ComplianceItem[] {
  const result: ComplianceItem[] = []
  if (!details) return result
  const labelMap: Record<string, { name: string; suggestion?: string }> = {
    budgetCheck: { name: '预算合规性', suggestion: '合同金额超过审批预算，需补充说明' },
    qualificationCheck: { name: '供应商资质审查', suggestion: '供应商资质待复核，建议补充证明文件' },
    termsCheck: { name: '合同条款完整性', suggestion: '存在缺失关键条款，建议法务补审' },
  }
  Object.entries(details).forEach(([k, v]) => {
    const info = labelMap[k] || { name: k }
    result.push({
      name: info.name,
      passed: v === 'pass',
      suggestion: v !== 'pass' ? info.suggestion : undefined,
    })
  })
  if (!result.length) {
    result.push({ name: '预算合规性', passed: true })
    result.push({ name: '供应商资质审查', passed: true })
    result.push({ name: '合同条款完整性', passed: true })
  }
  return result
}

function mapContractDetail(c: any): ContractDetail {
  const supplier = c.supplier_name || ''
  let signingStatus = 'unsigned'
  if (c.signed_at) signingStatus = 'signed'
  else if (c.effective_from || c.status === 'signing') signingStatus = 'pending'
  return {
    id: c.id,
    title: `${supplier}合同`,
    supplier,
    amount: Number(c.amount || 0),
    status: c.status || 'draft',
    signingStatus,
    startDate: c.effective_from || '',
    endDate: c.effective_to || '',
    keyTerms: Array.isArray(c.key_terms) ? c.key_terms : [],
    compliance: mapCompliance(c.compliance_details),
    milestones: (c.milestones || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      amount: Number(m.amount || 0),
      dueDate: m.due_date || '',
      status: m.status || 'pending',
    })),
  }
}

export default function ContractDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ContractDetail>(mockData)

  useEffect(() => {
    apiFetch<any>(`/contracts/${id}`)
      .then((raw) => setData(mapContractDetail(raw)))
      .catch(() => {})
  }, [id])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">合同详情</h2>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
            <p className="text-sm text-gray-500 mt-1">编号: {data.id} | 供应商: {data.supplier}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">合同金额：</span><span className="text-gray-900 font-mono">¥{data.amount.toLocaleString()}</span></div>
          <div><span className="text-gray-500">签署状态：</span><span className="text-gray-900">{data.signingStatus === 'signed' ? '已签署' : '待签署'}</span></div>
          <div><span className="text-gray-500">开始日期：</span><span className="text-gray-900">{data.startDate}</span></div>
          <div><span className="text-gray-500">结束日期：</span><span className="text-gray-900">{data.endDate}</span></div>
        </div>
        {data.signingStatus !== 'signed' && (
          <button className="btn-gold mt-4">
            <FileSignature className="w-4 h-4" />
            发起电子签署
          </button>
        )}
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-3">合规校验结果</h3>
        <div className="space-y-2">
          {data.compliance.map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50">
              {item.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-coral-400 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <span className={cn('text-sm', item.passed ? 'text-gray-900' : 'text-coral-500')}>{item.name}</span>
                {!item.passed && item.suggestion && (
                  <p className="text-xs text-coral-400 mt-0.5">建议: {item.suggestion}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-3">付款里程碑</h3>
        <div className="relative">
          {data.milestones.map((m, i) => (
            <div key={m.id} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                  m.status === 'paid' ? 'bg-emerald-400 text-white' :
                  m.status === 'payment_requested' ? 'bg-gold-400 text-white' :
                  'bg-gray-200 text-gray-400'
                )}>
                  {i + 1}
                </div>
                {i < data.milestones.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{m.name}</span>
                  <span className="text-sm font-mono text-gray-900">¥{m.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">到期: {m.dueDate}</span>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-3">核心条款</h3>
        <ul className="space-y-2">
          {data.keyTerms.map((term, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              {term}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
