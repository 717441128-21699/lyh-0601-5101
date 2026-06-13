import { Router, type Request, type Response } from 'express'
import { query, findOne, update, log } from '../database.js'

const router = Router()

router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const contracts = query('contracts')
    const milestones = query('payment_milestones')
    const requests = query('payment_requests')
    const grouped: any = {}
    contracts.forEach((c: any) => {
      grouped[c.id] = {
        contract: { id: c.id, supplier_name: c.supplier_name, amount: c.amount, status: c.status },
        milestones: [] as any[],
        payment_requests: [] as any[]
      }
    })
    milestones.forEach((m: any) => {
      if (grouped[m.contract_id]) {
        grouped[m.contract_id].milestones.push(m)
      }
    })
    requests.forEach((pr: any) => {
      if (grouped[pr.contract_id]) {
        grouped[pr.contract_id].payment_requests.push(pr)
      }
    })
    res.status(200).json({ success: true, data: Object.values(grouped) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取付款列表失败' })
  }
})

router.post('/:id/process', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const pr = findOne('payment_requests', (x: any) => x.id === id)
    if (!pr) {
      res.status(404).json({ success: false, message: '付款申请不存在' })
      return
    }
    const now = new Date().toISOString()
    update('payment_requests', id, { status: 'processed', processed_at: now })
    const acceptance = findOne('acceptances', (a: any) => a.id === pr.acceptance_id)
    if (acceptance?.milestone_id) {
      update('payment_milestones', acceptance.milestone_id, { status: 'paid' })
    }
    if (req.user) log(req.user.id, req.user.name, '处理付款', 'payment', id, `付款申请 ${id} 已处理`)
    res.status(200).json({ success: true, message: '付款已处理' })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '处理付款失败' })
  }
})

export default router
