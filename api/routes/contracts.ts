import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { query, findOne, insert, update, generateId, log, UPLOADS_DIR } from '../database.js'

const router = Router()

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('不支持的文件格式'))
  }
})

function parseContract(c: any) {
  const r = { ...c }
  if (c.key_terms) {
    try { r.key_terms = JSON.parse(c.key_terms) } catch { r.key_terms = [] }
  }
  if (c.compliance_details) {
    try { r.compliance_details = JSON.parse(c.compliance_details) } catch { r.compliance_details = {} }
  }
  return r
}

router.get('/', async (req: any, res: Response): Promise<void> => {
  try {
    const contracts = query('contracts')
    res.status(200).json({ success: true, data: contracts.map(parseContract) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取合同列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const contract = findOne('contracts', (x: any) => x.id === id)
    if (!contract) {
      res.status(404).json({ success: false, message: '合同不存在' })
      return
    }
    const milestones = query('payment_milestones', (m: any) => m.contract_id === id)
    res.status(200).json({ success: true, data: { ...parseContract(contract), milestones } })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取合同详情失败' })
  }
})

function runComplianceCheck(contractData: any, requirement: any, supplier: any) {
  let passed = 0
  let failed = 0
  const details: any = {}
  const budgetVerified = requirement && Number(contractData.amount) <= Number(requirement.budget)
  details.budgetCheck = budgetVerified ? 'pass' : 'fail'
  if (budgetVerified) passed++
  else failed++
  const qualificationVerified = supplier && supplier.status === 'active'
  details.qualificationCheck = qualificationVerified ? 'pass' : 'warning'
  if (qualificationVerified) passed++
  else failed++
  const termsCheck = contractData.key_terms && contractData.key_terms.length > 0
  details.termsCheck = termsCheck ? 'pass' : 'warning'
  if (termsCheck) passed++
  else failed++
  return { passed, failed, details, budgetVerified, qualificationVerified }
}

router.post('/', async (req: any, res: Response): Promise<void> => {
  try {
    const { approval_id, inquiry_id } = req.body
    if (!approval_id || !inquiry_id) {
      res.status(400).json({ success: false, message: '缺少必填字段' })
      return
    }
    const approval = findOne('approvals', (x: any) => x.id === approval_id)
    if (!approval) {
      res.status(404).json({ success: false, message: '审批单不存在' })
      return
    }
    if (approval.status !== 'approved') {
      res.status(400).json({ success: false, message: '审批未通过，无法创建合同' })
      return
    }
    const inquiry = findOne('inquiries', (x: any) => x.id === inquiry_id)
    if (!inquiry) {
      res.status(404).json({ success: false, message: '询价单不存在' })
      return
    }
    const requirement = findOne('requirements', (r: any) => r.id === inquiry.requirement_id)
    const qsList = query('inquiry_suppliers', (q: any) => q.inquiry_id === inquiry_id && q.status !== 'pending')
    const winnerQs = qsList.sort((a: any, b: any) => b.composite_score - a.composite_score)[0]
    const supplier = winnerQs ? findOne('suppliers', (s: any) => s.id === winnerQs.supplier_id) : null
    const contractId = generateId('HT')
    const now = new Date().toISOString()
    const keyTerms = ['预付款30%', '到货验收合格后付款50%', '质保期满无质量问题支付20%质保金']
    const amount = winnerQs ? winnerQs.price : (requirement?.budget || 0)
    const contractData = {
      id: contractId,
      requirement_id: inquiry.requirement_id,
      inquiry_id,
      supplier_id: supplier?.id || '',
      supplier_name: supplier?.name || '',
      amount,
      key_terms: JSON.stringify(keyTerms),
      compliance_passed: 0,
      compliance_failed: 0,
      compliance_details: JSON.stringify({}),
      budget_verified: false,
      qualification_verified: false,
      status: 'draft',
      is_offline: 0,
      file_name: null,
      signed_at: null,
      effective_from: '',
      effective_to: '',
      created_at: now
    }
    const compliance = runComplianceCheck({ ...contractData, key_terms: keyTerms }, requirement, supplier)
    contractData.compliance_passed = compliance.passed
    contractData.compliance_failed = compliance.failed
    contractData.compliance_details = JSON.stringify(compliance.details)
    contractData.budget_verified = compliance.budgetVerified
    contractData.qualification_verified = compliance.qualificationVerified
    insert('contracts', contractData)
    const percentages = [0.3, 0.5, 0.2]
    const names = ['预付款', '到货款', '质保金']
    percentages.forEach((pct, i) => {
      const msDate = new Date()
      msDate.setMonth(msDate.getMonth() + i)
      insert('payment_milestones', {
        id: generateId('ms'),
        contract_id: contractId,
        name: names[i],
        amount: Math.round(amount * pct),
        due_date: msDate.toISOString().split('T')[0],
        status: 'pending'
      })
    })
    if (req.user) log(req.user.id, req.user.name, '创建合同', 'contract', contractId, `创建合同: ${contractId}`)
    res.status(201).json({ success: true, data: parseContract(contractData) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '创建合同失败' })
  }
})

router.post('/:id/compliance-check', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const contract = findOne('contracts', (x: any) => x.id === id)
    if (!contract) {
      res.status(404).json({ success: false, message: '合同不存在' })
      return
    }
    const requirement = findOne('requirements', (r: any) => r.id === contract.requirement_id)
    const supplier = findOne('suppliers', (s: any) => s.id === contract.supplier_id)
    let keyTerms: any[] = []
    try { keyTerms = JSON.parse(contract.key_terms) } catch {}
    const compliance = runComplianceCheck({ key_terms: keyTerms, amount: contract.amount }, requirement, supplier)
    const updated = update('contracts', id, {
      compliance_passed: compliance.passed,
      compliance_failed: compliance.failed,
      compliance_details: JSON.stringify(compliance.details),
      budget_verified: compliance.budgetVerified,
      qualification_verified: compliance.qualificationVerified
    })
    res.status(200).json({ success: true, data: parseContract(updated) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '合规检查失败' })
  }
})

router.post('/:id/sign', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const contract = findOne('contracts', (x: any) => x.id === id)
    if (!contract) {
      res.status(404).json({ success: false, message: '合同不存在' })
      return
    }
    const now = new Date().toISOString()
    const effectiveFrom = new Date()
    const effectiveTo = new Date()
    effectiveTo.setMonth(effectiveTo.getMonth() + 6)
    const updated = update('contracts', id, {
      status: 'active',
      signed_at: now,
      effective_from: effectiveFrom.toISOString().split('T')[0],
      effective_to: effectiveTo.toISOString().split('T')[0]
    })
    if (contract.requirement_id) {
      update('requirements', contract.requirement_id, { status: 'contracted' })
    }
    if (req.user) log(req.user.id, req.user.name, '签署合同', 'contract', id, `电子签署合同: ${id}`)
    res.status(200).json({ success: true, data: parseContract(updated) })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '签署合同失败' })
  }
})

router.post('/upload', upload.single('file'), async (req: any, res: Response): Promise<void> => {
  try {
    const { requirementId, supplierName, amount } = req.body
    if (!requirementId || !supplierName || !amount) {
      res.status(400).json({ success: false, message: '缺少必填字段' })
      return
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: '请上传合同文件' })
      return
    }
    const requirement = findOne('requirements', (r: any) => r.id === requirementId)
    if (!requirement) {
      res.status(404).json({ success: false, message: '需求不存在' })
      return
    }
    const ext = path.extname(req.file.originalname).toLowerCase()
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
    const filePath = path.join(UPLOADS_DIR, fileName)
    fs.writeFileSync(filePath, req.file.buffer)
    const contractId = generateId('HT')
    const now = new Date().toISOString()
    const record = {
      id: contractId,
      requirement_id: requirementId,
      inquiry_id: null,
      supplier_id: '',
      supplier_name: supplierName,
      amount: Number(amount),
      key_terms: JSON.stringify([]),
      compliance_passed: 0,
      compliance_failed: 0,
      compliance_details: JSON.stringify({}),
      budget_verified: false,
      qualification_verified: false,
      status: 'draft',
      is_offline: 1,
      file_name: fileName,
      signed_at: null,
      effective_from: '',
      effective_to: '',
      created_at: now
    }
    insert('contracts', record)
    update('requirements', requirementId, { status: 'contracted' })
    if (req.user) log(req.user.id, req.user.name, '上传线下合同', 'contract', contractId, `上传线下合同文件: ${fileName}`)
    res.status(201).json({ success: true, data: { id: contractId, file_name: fileName } })
  } catch (err: any) {
    if (err.message && err.message.includes('不支持')) {
      res.status(400).json({ success: false, message: err.message })
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, message: '文件过大，不能超过20MB' })
    } else {
      res.status(500).json({ success: false, message: err.message || '上传合同失败' })
    }
  }
})

export default router
