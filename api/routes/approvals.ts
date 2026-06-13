import { Router, type Request, type Response } from 'express'
import { query, findOne, insert, update, generateId, log } from '../database.js'

const router = Router()

router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const { type, min_amount, max_amount, current_step, status, submitted_by } = req.query
    let approvals = query('approvals')
    if (type && type !== 'all') {
      approvals = approvals.filter((a: any) => a.type === type)
    }
    if (min_amount) {
      approvals = approvals.filter((a: any) => Number(a.amount) >= Number(min_amount))
    }
    if (max_amount) {
      approvals = approvals.filter((a: any) => Number(a.amount) <= Number(max_amount))
    }
    if (current_step && current_step !== 'all') {
      approvals = approvals.filter((a: any) => String(a.current_step) === String(current_step))
    }
    if (status && status !== 'all') {
      approvals = approvals.filter((a: any) => a.status === status)
    }
    const steps = query('approval_steps')
    const result = approvals.map((a: any) => ({
      ...a,
      steps: steps.filter((s: any) => s.approval_id === a.id)
    }))
    res.status(200).json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取审批列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const approval = findOne('approvals', (x: any) => x.id === id)
    if (!approval) {
      res.status(404).json({ success: false, message: '审批单不存在' })
      return
    }
    const steps = query('approval_steps', (s: any) => s.approval_id === id)
    const currentStep = steps.find((s: any) => s.step === approval.current_step)
    res.status(200).json({ success: true, data: { ...approval, steps, current_step_detail: currentStep } })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取审批详情失败' })
  }
})

router.post('/', async (req: any, res: Response): Promise<void> => {
  try {
    const { type, related_id, amount, title } = req.body
    if (!type || !related_id || !amount) {
      res.status(400).json({ success: false, message: '缺少必填字段' })
      return
    }
    const required_level = Number(amount) > 500000 ? 'director' : 'manager'
    const totalSteps = required_level === 'director' ? 2 : 1
    const approvalId = generateId('SP')
    const now = new Date().toISOString()
    const approval = {
      id: approvalId,
      type,
      related_id,
      amount: Number(amount),
      required_level,
      current_step: 1,
      status: 'pending',
      created_at: now
    }
    insert('approvals', approval)
    const managers = query('users', (u: any) => u.role === 'manager')
    const directors = query('users', (u: any) => u.role === 'approver' && u.department === '管理层')
    for (let step = 1; step <= totalSteps; step++) {
      let approver: any = null
      if (step === 1) {
        approver = managers[0] || { id: 'user-2', name: '张经理' }
      } else {
        approver = directors.find((d: any) => d.username === 'director') || directors[0] || { id: 'user-6', name: '刘总' }
      }
      insert('approval_steps', {
        id: generateId('aps'),
        approval_id: approvalId,
        step,
        role: step === 1 ? 'manager' : 'director',
        approver_id: approver?.id || '',
        approver_name: approver?.name || '',
        status: 'pending',
        comment: '',
        acted_at: null
      })
    }
    if (type === 'requirement') {
      update('requirements', related_id, { status: 'in_approval' })
    }
    if (req.user) log(req.user.id, req.user.name, '创建审批', 'approval', approvalId, `创建审批: ${title || approvalId}`)
    res.status(201).json({ success: true, data: approval })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '创建审批失败' })
  }
})

router.post('/:id/action', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { action, comment } = req.body
    if (!action || !['approved', 'rejected'].includes(action)) {
      res.status(400).json({ success: false, message: '无效的审批操作' })
      return
    }
    const approval = findOne('approvals', (x: any) => x.id === id)
    if (!approval) {
      res.status(404).json({ success: false, message: '审批单不存在' })
      return
    }
    if (approval.status !== 'pending') {
      res.status(400).json({ success: false, message: '该审批已处理完成' })
      return
    }
    const now = new Date().toISOString()
    const steps = query('approval_steps', (s: any) => s.approval_id === id)
    const currentStep = steps.find((s: any) => s.step === approval.current_step)
    if (!currentStep) {
      res.status(400).json({ success: false, message: '未找到当前审批步骤' })
      return
    }
    update('approval_steps', currentStep.id, {
      status: action,
      comment: comment || '',
      acted_at: now
    })
    if (action === 'rejected') {
      update('approvals', id, { status: 'rejected' })
      if (req.user) log(req.user.id, req.user.name, '审批驳回', 'approval', id, comment || '审批被驳回')
      const updated = findOne('approvals', (x: any) => x.id === id)
      res.status(200).json({ success: true, data: updated })
      return
    }
    const totalSteps = steps.length
    if (approval.current_step >= totalSteps) {
      update('approvals', id, { status: 'approved' })
      if (approval.type === 'requirement') {
        update('requirements', approval.related_id, { status: 'contracted' })
      }
      if (approval.type === 'contract') {
        update('contracts', approval.related_id, { status: 'active' })
      }
    } else {
      update('approvals', id, { current_step: approval.current_step + 1 })
    }
    if (req.user) log(req.user.id, req.user.name, '审批通过', 'approval', id, comment || '审批通过')
    const updatedApproval = findOne('approvals', (x: any) => x.id === id)
    const updatedSteps = query('approval_steps', (s: any) => s.approval_id === id)
    res.status(200).json({ success: true, data: { ...updatedApproval, steps: updatedSteps } })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '处理审批失败' })
  }
})

export default router
