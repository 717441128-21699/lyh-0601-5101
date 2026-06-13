import { Router, type Request, type Response } from 'express'
import { query, findOne, insert, update, generateId, log } from '../database.js'

const router = Router()

router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const inquiries = query('inquiries')
    const requirements = query('requirements')
    const suppliers = query('inquiry_suppliers')
    const result = inquiries.map((inq: any) => {
      const req = requirements.find((r: any) => r.id === inq.requirement_id)
      const qs = suppliers.filter((s: any) => s.inquiry_id === inq.id)
      return {
        ...inq,
        department: req?.department || '',
        supplierCount: qs.length,
        quoteCount: qs.filter((s: any) => s.status === 'quoted' || s.status === 'evaluated' || s.status === 'awarded').length
      }
    })
    res.status(200).json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取询价列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const inquiry = findOne('inquiries', (x: any) => x.id === id)
    if (!inquiry) {
      res.status(404).json({ success: false, message: '询价单不存在' })
      return
    }
    const requirement = findOne('requirements', (r: any) => r.id === inquiry.requirement_id)
    const qsList = query('inquiry_suppliers', (s: any) => s.inquiry_id === id)
    const supplierList = query('suppliers')
    const quotes = qsList.map((qs: any) => {
      const sp = supplierList.find((s: any) => s.id === qs.supplier_id)
      return { ...qs, supplier_name: sp?.name || '' }
    })
    res.status(200).json({ success: true, data: { ...inquiry, requirement, quotes } })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取询价详情失败' })
  }
})

router.post('/', async (req: any, res: Response): Promise<void> => {
  try {
    const { requirementId, supplierIds, deadline } = req.body
    if (!requirementId) {
      res.status(400).json({ success: false, message: '缺少需求ID' })
      return
    }
    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      res.status(400).json({ success: false, message: '请至少选择一个供应商' })
      return
    }
    const requirement = findOne('requirements', (r: any) => r.id === requirementId)
    if (!requirement) {
      res.status(404).json({ success: false, message: '需求不存在' })
      return
    }
    if (requirement.status === 'in_inquiry') {
      res.status(400).json({ success: false, message: '该需求已在询价中' })
      return
    }
    const inqId = generateId('XJ')
    const now = new Date().toISOString()
    const inquiry = {
      id: inqId,
      requirement_id: requirementId,
      title: requirement.title + '询价',
      category: requirement.category,
      deadline: deadline || '',
      status: 'quoting',
      price_weight: 0.3,
      delivery_weight: 0.3,
      quality_weight: 0.4,
      created_at: now
    }
    insert('inquiries', inquiry)
    supplierIds.forEach((sid: string) => {
      insert('inquiry_suppliers', {
        id: generateId('qs'),
        inquiry_id: inqId,
        supplier_id: sid,
        price: 0,
        delivery_days: 0,
        quality_score: 0,
        service_score: 0,
        qualification_score: 0,
        composite_score: 0,
        status: 'pending',
        quoted_at: null
      })
    })
    update('requirements', requirementId, { status: 'in_inquiry' })
    if (req.user) log(req.user.id, req.user.name, '创建询价', 'inquiry', inqId, `创建询价: ${inquiry.title}`)
    res.status(201).json({ success: true, data: inquiry })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '创建询价失败' })
  }
})

router.post('/:id/quote', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { supplierId, price, delivery_days, quality_score, service_score, qualification_score } = req.body
    const inquiry = findOne('inquiries', (x: any) => x.id === id)
    if (!inquiry) {
      res.status(404).json({ success: false, message: '询价单不存在' })
      return
    }
    const qs = findOne('inquiry_suppliers', (x: any) => x.inquiry_id === id && x.supplier_id === supplierId)
    if (!qs) {
      res.status(404).json({ success: false, message: '该供应商未被邀请参与此询价' })
      return
    }
    const now = new Date().toISOString()
    const updated = update('inquiry_suppliers', qs.id, {
      price: Number(price),
      delivery_days: Number(delivery_days),
      quality_score: Number(quality_score),
      service_score: Number(service_score),
      qualification_score: Number(qualification_score),
      status: 'quoted',
      quoted_at: now
    })
    if (req.user) log(req.user.id, req.user.name, '提交报价', 'inquiry', id, `供应商 ${supplierId} 提交报价`)
    res.status(200).json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '提交报价失败' })
  }
})

router.post('/:id/evaluate', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const inquiry = findOne('inquiries', (x: any) => x.id === id)
    if (!inquiry) {
      res.status(404).json({ success: false, message: '询价单不存在' })
      return
    }
    const qsList = query('inquiry_suppliers', (x: any) => x.inquiry_id === id && x.status === 'quoted')
    if (qsList.length === 0) {
      res.status(400).json({ success: false, message: '暂无已报价的供应商' })
      return
    }
    const prices = qsList.map((q: any) => q.price)
    const deliveries = qsList.map((q: any) => q.delivery_days)
    const minPrice = Math.min(...prices)
    const minDelivery = Math.min(...deliveries)
    const { price_weight = 0.3, delivery_weight = 0.3, quality_weight = 0.4 } = inquiry
    qsList.forEach((qs: any) => {
      const priceNorm = (minPrice / qs.price) * 100
      const deliveryNorm = (minDelivery / Math.max(qs.delivery_days, 1)) * 100
      const qualityNorm = qs.quality_score
      const composite = (priceNorm * price_weight + deliveryNorm * delivery_weight + qualityNorm * quality_weight)
      update('inquiry_suppliers', qs.id, {
        composite_score: Math.round(composite * 10) / 10,
        status: 'evaluated'
      })
    })
    update('inquiries', id, { status: 'evaluated' })
    if (req.user) log(req.user.id, req.user.name, '评标完成', 'inquiry', id, `询价 ${id} 自动评标完成`)
    const updatedQs = query('inquiry_suppliers', (x: any) => x.inquiry_id === id)
    res.status(200).json({ success: true, data: updatedQs })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '评标失败' })
  }
})

export default router
