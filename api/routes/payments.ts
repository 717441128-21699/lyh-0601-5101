import { Router, type Request, type Response } from 'express'
import { query, findOne, update, log } from '../database.js'

const router = Router()

router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const contracts = query('contracts')
    const milestones = query('payment_milestones')
    const requests = query('payment_requests')
    const acceptances = query('acceptances')
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
        const acceptance = acceptances.find((a: any) => a.id === pr.acceptance_id)
        const milestone = milestones.find((m: any) => m.id === pr.milestone_id)
        grouped[pr.contract_id].payment_requests.push({
          ...pr,
          acceptance,
          milestone,
        })
      }
    })
    res.status(200).json({ success: true, data: Object.values(grouped) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取付款列表失败' })
  }
})

router.get('/:id', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const pr = findOne('payment_requests', (x: any) => x.id === id)
    if (!pr) {
      res.status(404).json({ success: false, message: '付款申请不存在' })
      return
    }
    const contract = findOne('contracts', (c: any) => c.id === pr.contract_id)
    const milestone = findOne('payment_milestones', (m: any) => m.id === pr.milestone_id)
    const acceptance = findOne('acceptances', (a: any) => a.id === pr.acceptance_id)
    const timeline: any[] = [
      {
        type: 'submit',
        title: '申请提交',
        time: pr.created_at,
        user: '系统（验收自动触发）',
        comment: `验收完成后自动发起付款申请，金额 ¥${Number(pr.amount).toLocaleString()}`,
      },
    ]
    if (pr.status === 'rejected') {
      timeline.push({
        type: 'reject',
        title: '已打回',
        time: pr.processed_at,
        user: pr.processed_by || '财务',
        comment: pr.processed_comment || '申请不符合要求，已打回',
      })
    } else if (pr.status === 'paid' || pr.status === 'processed') {
      timeline.push({
        type: 'approve',
        title: '已支付',
        time: pr.processed_at,
        user: pr.processed_by || '财务',
        comment: pr.processed_comment || '款项已支付',
      })
    }
    const result = {
      id: pr.id,
      requestNo: pr.id,
      contractId: pr.contract_id,
      contractTitle: contract ? `${contract.supplier_name}合同` : '',
      supplier: contract?.supplier_name || '',
      contractAmount: Number(contract?.amount || 0),
      milestoneName: milestone?.name || '',
      milestoneDueDate: milestone?.due_date || '',
      amount: Number(pr.amount),
      status: pr.status,
      created_at: pr.created_at,
      processed_at: pr.processed_at,
      processed_by: pr.processed_by,
      processed_comment: pr.processed_comment,
      comment: pr.comment,
      acceptance_id: pr.acceptance_id,
      acceptance,
      contract,
      milestone,
      timeline,
    }
    res.status(200).json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取付款详情失败' })
  }
})

router.post('/:id/process', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { action, comment } = req.body
    const pr = findOne('payment_requests', (x: any) => x.id === id)
    if (!pr) {
      res.status(404).json({ success: false, message: '付款申请不存在' })
      return
    }
    if (pr.status !== 'pending' && action !== 'pay') {
      res.status(400).json({ success: false, message: '该申请已处理' })
      return
    }
    const now = new Date().toISOString()
    let newStatus = 'paid'
    if (action === 'reject') {
      newStatus = 'rejected'
    }
    update('payment_requests', id, {
      status: newStatus,
      processed_at: now,
      processed_by: req.user?.name || '财务',
      processed_comment: comment || '',
    })
    if (newStatus === 'paid') {
      const acceptance = findOne('acceptances', (a: any) => a.id === pr.acceptance_id)
      if (acceptance?.milestone_id) {
        update('payment_milestones', acceptance.milestone_id, { status: 'paid' })
      }
    }
    if (req.user) log(req.user.id, req.user.name, action === 'reject' ? '打回付款' : '处理付款', 'payment', id, `${action === 'reject' ? '打回' : '支付'}付款申请 ${id}：${comment || ''}`)
    res.status(200).json({ success: true, message: `付款已${action === 'reject' ? '打回' : '支付'}`, status: newStatus })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '处理付款失败' })
  }
})

export default router
