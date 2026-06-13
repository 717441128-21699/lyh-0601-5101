import { Router, type Request, type Response } from 'express'
import { query, findOne, insert, update, generateId, log } from '../database.js'

const router = Router()

function parseItems(a: any) {
  const r = { ...a }
  if (a.delivery_items) {
    try { r.delivery_items = typeof a.delivery_items === 'string' ? JSON.parse(a.delivery_items) : a.delivery_items } catch { r.delivery_items = [] }
  }
  return r
}

function calculatePaymentAmount(
  itemsWithMatch: any[],
  contract: any,
  milestone: any,
  deliveryList: any[]
): { amount: number; breakdown: any[] } {
  const totalOrderedQty = deliveryList.reduce((sum: number, d: any) => sum + Number(d.qty || 0), 0)
  const contractAmount = Number(contract?.amount || 0)
  const unitPrice = totalOrderedQty > 0 ? contractAmount / totalOrderedQty : 0

  const breakdown = itemsWithMatch.map((it: any) => {
    const actualQty = Number(it.actual_qty || 0)
    const price = unitPrice * actualQty
    return {
      name: it.name,
      spec: it.spec,
      ordered_qty: Number(it.ordered_qty || 0),
      actual_qty: actualQty,
      unit_price: Math.round(unitPrice * 100) / 100,
      subtotal: Math.round(price * 100) / 100,
    }
  })

  const totalAmount = breakdown.reduce((sum: number, b: any) => sum + b.subtotal, 0)
  const finalAmount = milestone?.amount ? Math.min(totalAmount, Number(milestone.amount)) : totalAmount

  return {
    amount: Math.round(finalAmount),
    breakdown,
  }
}

function buildContractDeliveryList(contract: any): any[] {
  if (!contract) return []
  const sampleDeliveries: Record<string, any[]> = {
    'HT-2024-001': [
      { name: '中央空调主机', spec: '格力 GMV-H120WL/A', qty: 2 },
      { name: '末端风机盘管', spec: '格力 FP-68', qty: 15 },
      { name: '安装辅材', spec: '铜管/电线/保温', qty: 1 },
    ],
    'HT-2024-002': [
      { name: 'A4复印纸', spec: '得力 70g 500张/包', qty: 500 },
      { name: 'A3复印纸', spec: '得力 70g 500张/包', qty: 100 },
    ],
    'HT-2024-003': [
      { name: '企业防火墙', spec: '华为 USG6305E', qty: 2 },
      { name: '入侵检测系统', spec: '华为 NIP6305', qty: 1 },
      { name: '核心交换机', spec: '华为 S5735-S48T4X', qty: 1 },
      { name: '光纤模块', spec: '华为 SFP-10G-SR', qty: 8 },
    ],
  }
  return sampleDeliveries[contract.id] || [
    { name: '合同标的物', spec: '按合同约定', qty: 1 },
  ]
}

router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const acceptances = query('acceptances')
    const contracts = query('contracts')
    const milestones = query('payment_milestones')
    const paymentRequests = query('payment_requests')
    const result = acceptances.map((a: any) => {
      const c = contracts.find((x: any) => x.id === a.contract_id)
      const m = milestones.find((x: any) => x.id === a.milestone_id)
      const pr = paymentRequests.find((x: any) => x.acceptance_id === a.id)
      return {
        ...parseItems(a),
        contract: c ? { id: c.id, supplier_name: c.supplier_name, amount: c.amount } : null,
        milestone: m || null,
        payment_request: pr || null,
      }
    })
    res.status(200).json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取验收列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const a = findOne('acceptances', (x: any) => x.id === id)
    if (!a) {
      res.status(404).json({ success: false, message: '验收单不存在' })
      return
    }
    const contract = findOne('contracts', (c: any) => c.id === a.contract_id)
    const milestone = findOne('payment_milestones', (m: any) => m.id === a.milestone_id)
    const paymentRequest = findOne('payment_requests', (pr: any) => pr.acceptance_id === id)
    const allAcceptancesForContract = query('acceptances', (x: any) => x.contract_id === a.contract_id)
    const history = allAcceptancesForContract
      .sort((x: any, y: any) => (x.accepted_at || '').localeCompare(y.accepted_at || ''))
      .filter((h: any) => h.status === 'completed')
      .map((h: any) => ({
        id: h.id,
        batch_no: h.batch_no,
        accepted_at: h.accepted_at,
        delivery_items: parseItems(h).delivery_items,
        comment: h.comment,
        payment_request_id: h.payment_request_id,
      }))
    const deliveryList = buildContractDeliveryList(contract)
    const acceptedTotals: Record<string, number> = {}
    history.forEach((h: any) => {
      h.delivery_items?.forEach((it: any) => {
        const key = it.name
        acceptedTotals[key] = (acceptedTotals[key] || 0) + Number(it.actual_qty || it.qty || 0)
      })
    })
    const deliveryWithStats = deliveryList.map((item) => ({
      ...item,
      accepted_qty: acceptedTotals[item.name] || 0,
      remaining_qty: Math.max(0, Number(item.qty) - (acceptedTotals[item.name] || 0)),
    }))
    const totalRemaining = deliveryWithStats.reduce((sum: number, it: any) => sum + it.remaining_qty, 0)
    const canAddBatch = a.status === 'completed' && totalRemaining > 0
    res.status(200).json({
      success: true,
      data: {
        ...parseItems(a),
        contract,
        milestone,
        payment_request: paymentRequest,
        history,
        delivery_list: deliveryWithStats,
        next_batch_no: history.length + 1,
        can_add_batch: canAddBatch,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取验收详情失败' })
  }
})

router.post('/:id/add-batch', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { delivery_items, comment } = req.body
    const existing = findOne('acceptances', (x: any) => x.id === id)
    if (!existing) {
      res.status(404).json({ success: false, message: '验收单不存在' })
      return
    }
    const contract = findOne('contracts', (c: any) => c.id === existing.contract_id)
    const deliveryList = buildContractDeliveryList(contract)
    const itemsWithMatch = (delivery_items || []).map((it: any) => ({
      name: it.name,
      spec: it.spec || deliveryList.find((d: any) => d.name === it.name)?.spec || '',
      ordered_qty: Number(it.ordered_qty || deliveryList.find((d: any) => d.name === it.name)?.qty || 0),
      actual_qty: Number(it.actual_qty || 0),
      match: Number(it.actual_qty || 0) >= Number(it.ordered_qty || deliveryList.find((d: any) => d.name === it.name)?.qty || 0),
    }))
    const now = new Date().toISOString()
    let acceptanceId = id
    let milestoneId = existing.milestone_id
    const existingCompleted = query('acceptances', (x: any) => x.contract_id === existing.contract_id && x.status === 'completed' && x.id !== id).length
    const batchNo = existingCompleted + 1
    if (existing.status === 'completed') {
      const newId = generateId('ys')
      insert('acceptances', {
        id: newId,
        contract_id: existing.contract_id,
        milestone_id: existing.milestone_id,
        delivery_items: JSON.stringify(itemsWithMatch),
        batch_no: batchNo,
        status: 'completed',
        accepted_at: now,
        comment: comment || '',
        payment_request_id: null,
      })
      acceptanceId = newId
    } else {
      update('acceptances', id, {
        delivery_items: JSON.stringify(itemsWithMatch),
        batch_no: batchNo,
        comment: comment || '',
        status: 'completed',
        accepted_at: now,
      })
    }
    if (milestoneId) {
      update('payment_milestones', milestoneId, { status: 'accepted' })
    }
    const prId = generateId('fk')
    const milestone = findOne('payment_milestones', (m: any) => m.id === milestoneId)
    const { amount, breakdown } = calculatePaymentAmount(itemsWithMatch, contract, milestone, deliveryList)
    insert('payment_requests', {
      id: prId,
      contract_id: existing.contract_id,
      acceptance_id: acceptanceId,
      milestone_id: milestoneId,
      amount: amount,
      status: 'pending',
      comment: comment || '',
      amount_breakdown: JSON.stringify(breakdown),
      created_at: now,
      processed_at: null,
      processed_by: null,
      processed_comment: null,
    })
    update('acceptances', acceptanceId, { payment_request_id: prId })
    if (req.user) log(req.user.id, req.user.name, '完成验收批次', 'acceptance', acceptanceId, `第${batchNo}批次验收：${comment || ''}，付款金额¥${amount}`)
    const updated = findOne('acceptances', (x: any) => x.id === acceptanceId)
    res.status(200).json({ success: true, data: parseItems(updated), payment_request_id: prId, payment_amount: amount })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '添加验收批次失败' })
  }
})

router.post('/:id/complete', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { accepted, comment, delivery_items } = req.body
    const acceptance = findOne('acceptances', (x: any) => x.id === id)
    if (!acceptance) {
      res.status(404).json({ success: false, message: '验收单不存在' })
      return
    }
    if (acceptance.status === 'completed') {
      res.status(400).json({ success: false, message: '该验收已完成，请使用新增批次功能' })
      return
    }
    const contract = findOne('contracts', (c: any) => c.id === acceptance.contract_id)
    const deliveryList = buildContractDeliveryList(contract)
    const itemsWithMatch = (delivery_items || []).map((it: any) => ({
      name: it.name,
      spec: it.spec || deliveryList.find((d: any) => d.name === it.name)?.spec || '',
      ordered_qty: Number(it.ordered_qty || deliveryList.find((d: any) => d.name === it.name)?.qty || 0),
      actual_qty: Number(it.actual_qty || 0),
      match: Number(it.actual_qty || 0) >= Number(it.ordered_qty || deliveryList.find((d: any) => d.name === it.name)?.qty || 0),
    }))
    const now = new Date().toISOString()
    const existingCompleted = query('acceptances', (x: any) => x.contract_id === acceptance.contract_id && x.status === 'completed').length
    const batchNo = existingCompleted + 1
    update('acceptances', id, {
      delivery_items: JSON.stringify(itemsWithMatch),
      batch_no: batchNo,
      comment: comment || '',
      status: 'completed',
      accepted_at: now,
    })
    if (acceptance.milestone_id) {
      update('payment_milestones', acceptance.milestone_id, { status: 'accepted' })
    }
    const prId = generateId('fk')
    const milestone = findOne('payment_milestones', (m: any) => m.id === acceptance.milestone_id)
    const { amount, breakdown } = calculatePaymentAmount(itemsWithMatch, contract, milestone, deliveryList)
    insert('payment_requests', {
      id: prId,
      contract_id: acceptance.contract_id,
      acceptance_id: id,
      milestone_id: acceptance.milestone_id,
      amount: amount,
      status: 'pending',
      comment: comment || '',
      amount_breakdown: JSON.stringify(breakdown),
      created_at: now,
      processed_at: null,
      processed_by: null,
      processed_comment: null,
    })
    update('acceptances', id, { payment_request_id: prId })
    if (req.user) log(req.user.id, req.user.name, '完成验收', 'acceptance', id, `第${batchNo}批次：${comment || '验收完成'}，付款金额¥${amount}`)
    const updated = findOne('acceptances', (x: any) => x.id === id)
    res.status(200).json({ success: true, data: parseItems(updated), payment_request_id: prId, payment_amount: amount })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '处理验收失败' })
  }
})

export default router
