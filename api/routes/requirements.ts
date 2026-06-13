import { Router, type Request, type Response } from 'express'
import { query, findOne, insert, update, generateId, log } from '../database.js'

const router = Router()

function parseSpecs(r: any) {
  const result = { ...r }
  if (r.specifications) {
    try {
      result.specifications = JSON.parse(r.specifications)
    } catch {
      result.specifications = []
    }
  }
  return result
}

router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const { department, category, status } = req.query
    let list = query('requirements')
    if (department) list = list.filter((r: any) => r.department === department)
    if (category) list = list.filter((r: any) => r.category === category)
    if (status) list = list.filter((r: any) => r.status === status)
    res.status(200).json({ success: true, data: list.map(parseSpecs) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取需求列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const r = findOne('requirements', (x: any) => x.id === id)
    if (!r) {
      res.status(404).json({ success: false, message: '需求不存在' })
      return
    }
    res.status(200).json({ success: true, data: parseSpecs(r) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取需求详情失败' })
  }
})

router.post('/', async (req: any, res: Response): Promise<void> => {
  try {
    const { title, department, category, description, specifications, budget, expected_delivery, source = 'manual' } = req.body
    if (!title || !department || !category || !budget) {
      res.status(400).json({ success: false, message: '缺少必填字段' })
      return
    }
    const id = generateId('XQ')
    const now = new Date().toISOString()
    const record = {
      id,
      title,
      department,
      category,
      description: description || '',
      specifications: typeof specifications === 'string' ? specifications : JSON.stringify(specifications || []),
      budget: Number(budget),
      expected_delivery: expected_delivery || '',
      status: 'pending',
      source,
      created_at: now
    }
    insert('requirements', record)
    if (req.user) log(req.user.id, req.user.name, '创建需求', 'requirement', id, `创建需求: ${title}`)
    res.status(201).json({ success: true, data: parseSpecs(record) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '创建需求失败' })
  }
})

router.put('/:id', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const existing = findOne('requirements', (x: any) => x.id === id)
    if (!existing) {
      res.status(404).json({ success: false, message: '需求不存在' })
      return
    }
    const patch: any = {}
    const allowed = ['title', 'department', 'category', 'description', 'budget', 'expected_delivery', 'status']
    allowed.forEach(k => {
      if (req.body[k] !== undefined) patch[k] = req.body[k]
    })
    if (req.body.specifications !== undefined) {
      patch.specifications = typeof req.body.specifications === 'string' ? req.body.specifications : JSON.stringify(req.body.specifications)
    }
    const updated = update('requirements', id, patch)
    if (req.user) log(req.user.id, req.user.name, '更新需求', 'requirement', id, `更新需求: ${existing.title}`)
    res.status(200).json({ success: true, data: parseSpecs(updated) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '更新需求失败' })
  }
})

export default router
