import { Router, type Request, type Response } from 'express'
import { query, findOne } from '../database.js'

const router = Router()

function parseSupplier(s: any) {
  const r = { ...s }
  if (s.categories) {
    try { r.categories = JSON.parse(s.categories) } catch { r.categories = [] }
  }
  r.composite_score = Math.round((s.on_time_rate * 0.3 + s.quality_rate * 0.4 + s.response_timeliness * 0.3) * 10) / 10
  return r
}

router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const suppliers = query('suppliers')
    res.status(200).json({ success: true, data: suppliers.map(parseSupplier) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取供应商列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const s = findOne('suppliers', (x: any) => x.id === id)
    if (!s) {
      res.status(404).json({ success: false, message: '供应商不存在' })
      return
    }
    const contracts = query('contracts', (c: any) => c.supplier_id === id)
    const scoreHistory: any[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      scoreHistory.push({
        date: d.toISOString().split('T')[0],
        on_time_rate: Math.max(70, Math.min(100, s.on_time_rate + (Math.random() * 10 - 5))),
        quality_rate: Math.max(70, Math.min(100, s.quality_rate + (Math.random() * 10 - 5))),
        response_timeliness: Math.max(70, Math.min(100, s.response_timeliness + (Math.random() * 10 - 5)))
      })
    }
    res.status(200).json({ success: true, data: { ...parseSupplier(s), score_history: scoreHistory, contracts } })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取供应商详情失败' })
  }
})

export default router
