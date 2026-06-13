import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, CreditCard, Plus, History, Package, Eye, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch, useToastStore } from '@/store'

interface DeliveryItem {
  name: string
  spec: string
  qty: number
  accepted_qty: number
  remaining_qty: number
  actual_qty: number
  ordered_qty: number
  match: boolean
}

interface AcceptanceHistory {
  id: string
  batch_no: number
  accepted_at: string
  delivery_items: any[]
  comment: string
  payment_request_id: string
}

interface AcceptanceDetail {
  id: string
  contractId: string
  title: string
  supplier: string
  contractAmount: number
  status: string
  deliveryList: DeliveryItem[]
  currentDeliveryItems: DeliveryItem[]
  history: AcceptanceHistory[]
  nextBatchNo: number
  paymentRequestId: string
  milestoneName: string
  milestoneDueDate: string
  acceptedAt: string
  batchNo: number
  comment: string
}

const mockData: AcceptanceDetail = {
  id: '',
  contractId: '',
  title: '',
  supplier: '',
  contractAmount: 0,
  status: 'pending_acceptance',
  deliveryList: [],
  currentDeliveryItems: [],
  history: [],
  nextBatchNo: 1,
  paymentRequestId: '',
  milestoneName: '',
  milestoneDueDate: '',
  acceptedAt: '',
  batchNo: 0,
  comment: '',
}

function mapAcceptanceStatus(s: string): string {
  if (s === 'completed') return 'accepted'
  return 'pending_acceptance'
}

function normalizeCurrentItems(rawItems: any[], deliveryList: any[]): DeliveryItem[] {
  if (!rawItems || !rawItems.length) {
    return deliveryList.map((d) => ({
      name: d.name,
      spec: d.spec || '',
      qty: Number(d.qty || 0),
      accepted_qty: Number(d.accepted_qty || 0),
      remaining_qty: Number(d.remaining_qty || 0),
      actual_qty: 0,
      ordered_qty: Number(d.qty || 0) - Number(d.accepted_qty || 0),
      match: false,
    }))
  }
  return rawItems.map((it) => {
    const dl = deliveryList.find((d: any) => d.name === it.name) || {}
    return {
      name: it.name || it.item || '检查项',
      spec: it.spec || dl.spec || '',
      qty: Number(dl.qty || 0),
      accepted_qty: Number(dl.accepted_qty || 0),
      remaining_qty: Number(dl.remaining_qty || 0),
      actual_qty: Number(it.actual_qty || it.actual || it.delivered || 0),
      ordered_qty: Number(it.ordered_qty || it.ordered || it.expected || dl.qty || 0),
      match: typeof it.match === 'boolean' ? it.match : Number(it.actual_qty || 0) >= Number(it.ordered_qty || 0),
    }
  })
}

export default function AcceptanceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.showToast)
  const [data, setData] = useState<AcceptanceDetail>(mockData)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showAddBatch, setShowAddBatch] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [acceptanceComment, setAcceptanceComment] = useState('')
  const [batchDeliveryItems, setBatchDeliveryItems] = useState<DeliveryItem[]>([])

  useEffect(() => {
    if (!id) return
    apiFetch<any>(`/acceptances/${id}`)
      .then((raw: any) => {
        const supplier = raw.contract?.supplier_name || ''
        const msName = raw.milestone?.name || '验收'
        const deliveryList = (raw.delivery_list || []).map((d: any) => ({
          name: d.name,
          spec: d.spec || '',
          qty: Number(d.qty || 0),
          accepted_qty: Number(d.accepted_qty || 0),
          remaining_qty: Number(d.remaining_qty || 0),
          actual_qty: 0,
          ordered_qty: Math.max(0, Number(d.qty || 0) - Number(d.accepted_qty || 0)),
          match: false,
        }))
        const mapped: AcceptanceDetail = {
          id: raw.id,
          contractId: raw.contract_id,
          title: `${supplier}${msName}`,
          supplier,
          contractAmount: Number(raw.contract?.amount || raw.amount || 0),
          status: mapAcceptanceStatus(raw.status),
          deliveryList,
          currentDeliveryItems: normalizeCurrentItems(raw.delivery_items || [], deliveryList),
          history: (raw.history || []).map((h: any) => ({
            ...h,
            accepted_at: h.accepted_at ? h.accepted_at.replace('T', ' ').slice(0, 16) : '',
          })),
          nextBatchNo: raw.next_batch_no || 1,
          paymentRequestId: raw.payment_request?.id || raw.payment_request_id || '',
          milestoneName: raw.milestone?.name || '',
          milestoneDueDate: raw.milestone?.due_date || '',
          acceptedAt: raw.accepted_at ? raw.accepted_at.replace('T', ' ').slice(0, 16) : '',
          batchNo: raw.batch_no || 0,
          comment: raw.comment || '',
        }
        setData(mapped)
        if (raw.status !== 'completed') {
          setBatchDeliveryItems(deliveryList)
        } else {
          setBatchDeliveryItems(deliveryList.map((d) => ({
            ...d,
            actual_qty: Math.min(d.ordered_qty, d.remaining_qty),
            match: d.remaining_qty > 0 && Math.min(d.ordered_qty, d.remaining_qty) >= d.ordered_qty,
          })))
        }
      })
      .catch(() => {})
  }, [id])

  const refreshData = async () => {
    if (!id) return
    try {
      const raw = await apiFetch<any>(`/acceptances/${id}`)
      const supplier = raw.contract?.supplier_name || ''
      const msName = raw.milestone?.name || '验收'
      const deliveryList = (raw.delivery_list || []).map((d: any) => ({
        name: d.name,
        spec: d.spec || '',
        qty: Number(d.qty || 0),
        accepted_qty: Number(d.accepted_qty || 0),
        remaining_qty: Number(d.remaining_qty || 0),
        actual_qty: 0,
        ordered_qty: Math.max(0, Number(d.qty || 0) - Number(d.accepted_qty || 0)),
        match: false,
      }))
      const mapped: AcceptanceDetail = {
        id: raw.id,
        contractId: raw.contract_id,
        title: `${supplier}${msName}`,
        supplier,
        contractAmount: Number(raw.contract?.amount || raw.amount || 0),
        status: mapAcceptanceStatus(raw.status),
        deliveryList,
        currentDeliveryItems: normalizeCurrentItems(raw.delivery_items || [], deliveryList),
        history: (raw.history || []).map((h: any) => ({
          ...h,
          accepted_at: h.accepted_at ? h.accepted_at.replace('T', ' ').slice(0, 16) : '',
        })),
        nextBatchNo: raw.next_batch_no || 1,
        paymentRequestId: raw.payment_request?.id || raw.payment_request_id || '',
        milestoneName: raw.milestone?.name || '',
        milestoneDueDate: raw.milestone?.due_date || '',
        acceptedAt: raw.accepted_at ? raw.accepted_at.replace('T', ' ').slice(0, 16) : '',
        batchNo: raw.batch_no || 0,
        comment: raw.comment || '',
      }
      setData(mapped)
      if (raw.status !== 'completed') {
        setBatchDeliveryItems(deliveryList)
      } else {
        setBatchDeliveryItems(deliveryList.map((d) => ({
          ...d,
          actual_qty: Math.min(d.ordered_qty, d.remaining_qty),
          match: d.remaining_qty > 0 && Math.min(d.ordered_qty, d.remaining_qty) >= d.ordered_qty,
        })))
      }
    } catch {}
  }

  const handleActualQtyChange = (idx: number, value: string) => {
    const num = parseInt(value) || 0
    setBatchDeliveryItems((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        actual_qty: num,
        match: num >= next[idx].ordered_qty && next[idx].ordered_qty > 0,
      }
      return next
    })
  }

  const handleComplete = async () => {
    setError('')
    setSubmitting(true)
    try {
      const endpoint = data.status === 'accepted' ? '/add-batch' : '/complete'
      const res = await apiFetch<any>(`/acceptances/${id}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({
          accepted: true,
          comment: acceptanceComment,
          delivery_items: batchDeliveryItems.map((it) => ({
            name: it.name,
            spec: it.spec,
            ordered_qty: it.ordered_qty,
            actual_qty: it.actual_qty,
          })),
        }),
      })
      showToast(`第${data.nextBatchNo}批次验收完成，已生成付款申请`, 'success')
      setShowConfirm(false)
      setShowAddBatch(false)
      setAcceptanceComment('')
      await refreshData()
      if (res.payment_request_id) {
        setTimeout(() => navigate(`/payments/${res.payment_request_id}`), 800)
      }
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const allMatch = batchDeliveryItems.every((item) => item.match || item.ordered_qty === 0)
  const hasActualQty = batchDeliveryItems.some((item) => item.actual_qty > 0)
  const canComplete = data.status === 'pending_acceptance' || data.status === 'pending'
  const canAddBatch = data.status === 'accepted' && data.deliveryList.some((d) => d.remaining_qty > 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-neutral-900">验收详情</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-neutral-900">{data.title}</h3>
                <StatusBadge status={data.status === 'accepted' ? '已验收' : '待验收'} color={data.status === 'accepted' ? 'success' : 'warning'} />
              </div>
              <p className="text-sm text-neutral-500">
                编号: {data.id} | 合同: <Link to={`/contracts/${data.contractId}`} className="text-primary-600 hover:underline">{data.contractId}</Link> | 供应商: {data.supplier}
              </p>
              {data.batchNo > 0 && (
                <p className="text-sm text-neutral-500 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                    第 {data.batchNo} 批次
                  </span>
                  {data.acceptedAt && <span className="ml-2">验收时间: {data.acceptedAt}</span>}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-neutral-500 mb-1">合同金额</div>
              <div className="text-2xl font-bold text-primary-600">
                ¥{data.contractAmount.toLocaleString()}
              </div>
              {data.milestoneName && (
                <div className="text-xs text-neutral-500 mt-1">
                  节点: {data.milestoneName} · 到期: {data.milestoneDueDate}
                </div>
              )}
            </div>
          </div>
        </div>

        {data.comment && (
          <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <div className="text-sm text-neutral-500 mb-1">验收备注</div>
            <div className="text-neutral-700">{data.comment}</div>
          </div>
        )}

        {data.paymentRequestId && (
          <div className="px-6 py-4 border-b border-neutral-100 bg-emerald-50/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-500 mb-1">关联付款申请</div>
                <Link
                  to={`/payments/${data.paymentRequestId}`}
                  className="text-primary-600 hover:underline font-medium flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  查看付款申请 {data.paymentRequestId}
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary-500" />
            <h3 className="text-base font-semibold text-neutral-900">合同交付清单 & 验收进度</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-left">交付项</th>
                  <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-left">规格</th>
                  <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">合同总数</th>
                  <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">已验收</th>
                  <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">待验收</th>
                  <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-center">进度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {data.deliveryList.map((item, i) => {
                  const progress = item.qty > 0 ? Math.min(100, Math.round((item.accepted_qty / item.qty) * 100)) : 0
                  return (
                    <tr key={i}>
                      <td className="px-4 py-3 text-sm text-neutral-900 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-neutral-500">{item.spec}</td>
                      <td className="px-4 py-3 text-sm text-neutral-900 text-right font-mono">{item.qty}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 text-right font-mono font-medium">{item.accepted_qty}</td>
                      <td className="px-4 py-3 text-sm text-amber-600 text-right font-mono">{item.remaining_qty}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden min-w-[80px]">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                progress === 100 ? "bg-emerald-500" : "bg-amber-500"
                              )}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-neutral-500 w-10 text-right">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {data.deliveryList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-400 text-sm">
                      暂无交付清单
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {data.currentDeliveryItems.length > 0 && (data.status === 'accepted' || data.batchNo > 0) && (
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/30">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-primary-500" />
              <h3 className="text-base font-semibold text-neutral-900">本次验收明细</h3>
              {data.batchNo > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                  第 {data.batchNo} 批次
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border border-neutral-100">
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-left">交付项</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">应到数量</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">实到数量</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-center">结果</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {data.currentDeliveryItems.map((item, i) => (
                    <tr key={i} className={cn(!item.match && 'bg-red-50/30')}>
                      <td className="px-4 py-3 text-sm text-neutral-900 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700 text-right font-mono">{item.ordered_qty || item.qty}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700 text-right font-mono">{item.actual_qty}</td>
                      <td className="px-4 py-3 text-center">
                        {item.match ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {data.history.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary-500" />
              <h3 className="text-base font-semibold text-neutral-900">验收历史记录</h3>
              <span className="text-sm text-neutral-500">共 {data.history.length} 次验收</span>
            </div>
          </div>
          <div className="divide-y divide-neutral-50">
            {data.history.map((h, idx) => (
              <div key={h.id} className="p-6 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold">
                      #{h.batch_no}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">第 {h.batch_no} 批次验收</div>
                      <div className="text-xs text-neutral-500">验收时间: {h.accepted_at}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {h.payment_request_id && (
                      <Link
                        to={`/payments/${h.payment_request_id}`}
                        className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        付款申请 {h.payment_request_id}
                      </Link>
                    )}
                    <StatusBadge status="已通过" color="success" />
                  </div>
                </div>
                {h.delivery_items?.length > 0 && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <div className="text-xs text-neutral-500 mb-2">验收明细</div>
                    <div className="flex flex-wrap gap-2">
                      {h.delivery_items.map((it: any, di: number) => (
                        <span key={di} className="text-xs px-2 py-1 bg-white rounded border border-neutral-100 text-neutral-700">
                          {it.name}: {it.actual_qty || it.qty || '-'} / {it.ordered_qty || it.expected || '-'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {h.comment && (
                  <div className="mt-2 text-sm text-neutral-600">
                    <span className="text-neutral-400">备注:</span> {h.comment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(canComplete || canAddBatch) && (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary-500" />
              <h3 className="text-base font-semibold text-neutral-900">
                {canAddBatch ? `新增第 ${data.nextBatchNo} 批次验收` : '完成验收'}
              </h3>
            </div>
            <p className="text-sm text-neutral-500">
              {canAddBatch
                ? '该合同还有未验收完成的交付项，请填写本次实际到货数量，完成后将生成对应批次的付款申请'
                : '请核对实际到货数量，完成验收后将自动生成付款申请'}
            </p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-left">交付项</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-center">规格</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">本次应交</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-right">本次实到</th>
                    <th className="px-4 py-3 text-xs font-medium text-neutral-500 text-center">核对</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {batchDeliveryItems.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-sm text-neutral-900 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-neutral-500 text-center">{item.spec}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700 text-right font-mono">{item.ordered_qty}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max={item.ordered_qty}
                          value={item.actual_qty || ''}
                          onChange={(e) => handleActualQtyChange(i, e.target.value)}
                          className="w-24 px-3 py-1.5 border border-neutral-200 rounded-lg text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.match ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : item.actual_qty > 0 ? (
                          <div className="flex items-center justify-center gap-1 text-amber-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs">不足</span>
                          </div>
                        ) : (
                          <span className="text-neutral-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">验收备注</label>
              <textarea
                value={acceptanceComment}
                onChange={(e) => setAcceptanceComment(e.target.value)}
                placeholder="请输入验收备注（可选）"
                rows={2}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
            {!allMatch && hasActualQty && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>部分交付项实到数量少于应交数量，仍可提交验收，但付款申请将按实际到货数量生成</div>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirm(true)
                  setError('')
                }}
                disabled={!hasActualQty || submitting}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {canAddBatch ? <Plus className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                {canAddBatch ? '提交本次验收' : '完成验收'}
              </button>
              {!hasActualQty && (
                <span className="text-sm text-neutral-400 self-center">请至少填写一项实到数量</span>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              确认{canAddBatch ? `第${data.nextBatchNo}批次验收` : '完成验收'}
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              提交后将自动生成对应批次的付款申请，该申请将进入付款管理流程等待财务处理。
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleComplete}
                disabled={submitting}
                className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {submitting ? '处理中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
