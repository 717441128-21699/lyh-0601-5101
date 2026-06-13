import { Router, type Request, type Response } from 'express'
import { query, findOne, insert, update, generateId, log } from '../database.js'

const router = Router()

function parseItems(a: any) {
  const r = { ...a }
  if (a.delivery_items) {
    try { r.delivery_items = JSON.parse(a.delivery_items) } catch { r.delivery_items = [] }
  }
  return r
}

router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const acceptances = query('acceptances')
    const contracts = query('contracts')
    const milestones = query('payment_milestones')
    const result = acceptances.map((a: any) => {
      const c = contracts.find((x: any) => x.id === a.contract_id)
      const m = milestones.find((x: any) => x.id === a.milestone_id)
      return { ...parseItems(a), contract: c ? { id: c.id, supplier_name: c.supplier_name, amount: c.amount } : null, milestone: m || null }
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
    res.status(200).json({ success: true, data: { ...parseItems(a), contract, milestone } })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取验收详情失败' })
  }
})

router.post('/:id/complete', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { accepted, comment } = req.body
    const acceptance = findOne('acceptances', (x: any) => x.id === id)
    if (!acceptance) {
      res.status(404).json({ success: false, message: '验收单不存在' })
      return
    }
    if (acceptance.status === 'completed') {
      res.status(400).json({ success: false, message: '该验收已完成' })
      return
    }
    const now = new Date().toISOString()
    update('acceptances', id, { status: 'completed', accepted_at: now })
    if (acceptance.milestone_id) {
      update('payment_milestones', acceptance.milestone_id, { status: 'accepted' })
    }
    const prId = generateId('fk')
    const milestone = findOne('payment_milestones', (m: any) => m.id === acceptance.milestone_id)
    insert('payment_requests', {
      id: prId,
      contract_id: acceptance.contract_id,
      acceptance_id: id,
      amount: milestone?.amount || 0,
      status: 'pending',
      created_at: now,
      processed_at: null
    })
    update('acceptances', id, { payment_request_id: prId })
    if (req.user) log(req.user.id, req.user.name, '完成验收', 'acceptance', id, comment || '验收完成')
    const updated = findOne('acceptances', (x: any) => x.id === id)
    res.status(200).json({ success: true, data: parseItems(updated), payment_request_id: prId })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '处理验收失败' })
  }
})

export default router
