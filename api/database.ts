import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '..', 'data')
const DB_PATH = path.join(DATA_DIR, 'db.json')
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')

let cachedDB: any = null

interface Database {
  users: any[]
  requirements: any[]
  suppliers: any[]
  inquiries: any[]
  inquiry_suppliers: any[]
  approvals: any[]
  approval_steps: any[]
  contracts: any[]
  payment_milestones: any[]
  acceptances: any[]
  payment_requests: any[]
  operation_logs: any[]
  alerts: any[]
  daily_statistics: any[]
  department_statistics: any[]
}

function getEmptyDB(): Database {
  return {
    users: [],
    requirements: [],
    suppliers: [],
    inquiries: [],
    inquiry_suppliers: [],
    approvals: [],
    approval_steps: [],
    contracts: [],
    payment_milestones: [],
    acceptances: [],
    payment_requests: [],
    operation_logs: [],
    alerts: [],
    daily_statistics: [],
    department_statistics: [],
  }
}

function generateId(prefix: string): string {
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${Date.now()}${rand}`
}

function seedDB(db: Database): Database {
  const now = new Date().toISOString()

  db.users = [
    { id: 'user-1', username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', department: '系统部', created_at: now },
    { id: 'user-2', username: 'manager', password: 'manager123', name: '张经理', role: 'manager', department: '采购部', created_at: now },
    { id: 'user-3', username: 'procurement', password: 'procurement123', name: '李专员', role: 'procurement', department: '采购部', created_at: now },
    { id: 'user-4', username: 'approver', password: 'approver123', name: '王总监', role: 'approver', department: '管理层', created_at: now },
    { id: 'user-5', username: 'finance', password: 'finance123', name: '赵财务', role: 'finance', department: '财务部', created_at: now },
    { id: 'user-6', username: 'director', password: 'director123', name: '刘总', role: 'approver', department: '管理层', created_at: now },
  ]

  db.requirements = [
    { id: 'XQ-2024-001', title: '办公电脑采购', department: '信息部', category: '电子设备', description: '为信息部及各部门采购办公用台式电脑', specifications: JSON.stringify([{name: 'CPU', value: 'Intel i5'}, {name: '内存', value: '16GB'}, {name: '硬盘', value: '512GB SSD'}]), budget: 150000, expected_delivery: '2024-02-20', status: 'in_inquiry', source: 'auto', created_at: now },
    { id: 'XQ-2024-002', title: '实验室试剂采购', department: '研发部', category: '实验耗材', description: '研发实验室常用化学试剂', specifications: JSON.stringify([{name: '纯度', value: '分析纯'}, {name: '规格', value: '500ml/瓶'}]), budget: 80000, expected_delivery: '2024-02-15', status: 'in_approval', source: 'auto', created_at: now },
    { id: 'XQ-2024-003', title: '空调设备更换', department: '行政部', category: '机电设备', description: '办公楼老旧中央空调系统更换', specifications: JSON.stringify([{name: '制冷量', value: '5匹'}, {name: '能效等级', value: '一级'}]), budget: 320000, expected_delivery: '2024-03-01', status: 'contracted', source: 'auto', created_at: now },
    { id: 'XQ-2024-004', title: '打印纸批量采购', department: '行政部', category: '办公用品', description: '季度办公打印纸采购', specifications: JSON.stringify([{name: '规格', value: 'A4'}, {name: '克重', value: '70g'}]), budget: 25000, expected_delivery: '2024-01-25', status: 'completed', source: 'auto', created_at: now },
    { id: 'XQ-2024-005', title: '网络安全设备升级', department: '信息部', category: '电子设备', description: '企业防火墙和入侵检测系统升级', specifications: JSON.stringify([{name: '吞吐量', value: '10Gbps'}, {name: '并发连接', value: '500万'}]), budget: 500000, expected_delivery: '2024-03-15', status: 'contracted', source: 'auto', created_at: now },
    { id: 'XQ-2024-006', title: '员工工服定制', department: '人力资源部', category: '服装纺织', description: '新季度员工工作服定制', specifications: JSON.stringify([{name: '面料', value: '棉质混纺'}, {name: '季节', value: '春秋款'}]), budget: 60000, expected_delivery: '2024-04-01', status: 'pending', source: 'auto', created_at: now },
    { id: 'XQ-2024-007', title: '会议室音视频系统', department: '行政部', category: '电子设备', description: '大型会议室音视频设备升级', specifications: JSON.stringify([{name: '投影', value: '4K激光'}, {name: '音响', value: '环绕立体声'}]), budget: 200000, expected_delivery: '2024-03-20', status: 'pending', source: 'auto', created_at: now },
    { id: 'XQ-2024-008', title: '消防器材更换', department: '安全部', category: '安全设备', description: '全楼灭火器及消防器材更换', specifications: JSON.stringify([{name: '类型', value: '干粉灭火器'}, {name: '规格', value: '4kg/具'}]), budget: 45000, expected_delivery: '2024-02-28', status: 'pending', source: 'auto', created_at: now },
  ]

  db.suppliers = [
    { id: 'SP-001', name: '华信科技', categories: JSON.stringify(['电子设备', '办公用品']), contact_person: '陈经理', phone: '13800138001', email: 'chen@huaxin.com', on_time_rate: 92, quality_rate: 88, response_timeliness: 85, qualification_expiry: '2025-06-30', status: 'active' },
    { id: 'SP-002', name: '中联数码', categories: JSON.stringify(['电子设备', '实验耗材']), contact_person: '刘经理', phone: '13800138002', email: 'liu@zhonglian.com', on_time_rate: 88, quality_rate: 92, response_timeliness: 90, qualification_expiry: '2025-08-15', status: 'active' },
    { id: 'SP-003', name: '联想集团', categories: JSON.stringify(['电子设备']), contact_person: '王经理', phone: '13800138003', email: 'wang@lenovo.com', on_time_rate: 95, quality_rate: 95, response_timeliness: 80, qualification_expiry: '2026-01-20', status: 'active' },
    { id: 'SP-004', name: '得力文具', categories: JSON.stringify(['办公用品']), contact_person: '赵经理', phone: '13800138004', email: 'zhao@deli.com', on_time_rate: 98, quality_rate: 90, response_timeliness: 95, qualification_expiry: '2025-12-01', status: 'active' },
    { id: 'SP-005', name: '格力电器', categories: JSON.stringify(['机电设备']), contact_person: '孙经理', phone: '13800138005', email: 'sun@gree.com', on_time_rate: 85, quality_rate: 93, response_timeliness: 78, qualification_expiry: '2025-09-10', status: 'active' },
    { id: 'SP-006', name: '海康威视', categories: JSON.stringify(['电子设备', '安全设备']), contact_person: '周经理', phone: '13800138006', email: 'zhou@hikvision.com', on_time_rate: 90, quality_rate: 96, response_timeliness: 82, qualification_expiry: '2026-03-05', status: 'active' },
  ]

  db.inquiries = [
    { id: 'XJ-2024-001', requirement_id: 'XQ-2024-001', title: '办公电脑采购询价', category: '电子设备', deadline: '2024-02-10', status: 'quoting', price_weight: 0.3, delivery_weight: 0.3, quality_weight: 0.4, created_at: now },
    { id: 'XJ-2024-002', requirement_id: 'XQ-2024-002', title: '实验室试剂采购询价', category: '实验耗材', deadline: '2024-02-05', status: 'evaluated', price_weight: 0.3, delivery_weight: 0.3, quality_weight: 0.4, created_at: now },
    { id: 'XJ-2024-003', requirement_id: 'XQ-2024-003', title: '空调设备更换询价', category: '机电设备', deadline: '2024-02-15', status: 'evaluated', price_weight: 0.3, delivery_weight: 0.3, quality_weight: 0.4, created_at: now },
    { id: 'XJ-2024-004', requirement_id: 'XQ-2024-004', title: '打印纸批量采购询价', category: '办公用品', deadline: '2024-01-20', status: 'closed', price_weight: 0.3, delivery_weight: 0.3, quality_weight: 0.4, created_at: now },
  ]

  db.inquiry_suppliers = [
    { id: generateId('qs'), inquiry_id: 'XJ-2024-001', supplier_id: 'SP-001', price: 145000, delivery_days: 15, quality_score: 85, service_score: 88, qualification_score: 90, composite_score: 0, status: 'quoted', quoted_at: now },
    { id: generateId('qs'), inquiry_id: 'XJ-2024-001', supplier_id: 'SP-002', price: 148000, delivery_days: 12, quality_score: 88, service_score: 85, qualification_score: 88, composite_score: 0, status: 'quoted', quoted_at: now },
    { id: generateId('qs'), inquiry_id: 'XJ-2024-001', supplier_id: 'SP-003', price: 152000, delivery_days: 10, quality_score: 95, service_score: 90, qualification_score: 95, composite_score: 0, status: 'quoted', quoted_at: now },
    { id: generateId('qs'), inquiry_id: 'XJ-2024-001', supplier_id: 'SP-006', price: 140000, delivery_days: 18, quality_score: 82, service_score: 80, qualification_score: 85, composite_score: 0, status: 'pending', quoted_at: null },

    { id: generateId('qs'), inquiry_id: 'XJ-2024-002', supplier_id: 'SP-002', price: 78000, delivery_days: 7, quality_score: 92, service_score: 90, qualification_score: 88, composite_score: 89.5, status: 'evaluated', quoted_at: now },
    { id: generateId('qs'), inquiry_id: 'XJ-2024-002', supplier_id: 'SP-001', price: 82000, delivery_days: 10, quality_score: 85, service_score: 88, qualification_score: 90, composite_score: 82.3, status: 'evaluated', quoted_at: now },

    { id: generateId('qs'), inquiry_id: 'XJ-2024-003', supplier_id: 'SP-005', price: 315000, delivery_days: 20, quality_score: 93, service_score: 85, qualification_score: 90, composite_score: 88.7, status: 'evaluated', quoted_at: now },
    { id: generateId('qs'), inquiry_id: 'XJ-2024-003', supplier_id: 'SP-001', price: 330000, delivery_days: 25, quality_score: 85, service_score: 88, qualification_score: 85, composite_score: 78.2, status: 'evaluated', quoted_at: now },

    { id: generateId('qs'), inquiry_id: 'XJ-2024-004', supplier_id: 'SP-004', price: 24500, delivery_days: 5, quality_score: 90, service_score: 95, qualification_score: 92, composite_score: 92.1, status: 'awarded', quoted_at: now },
  ]

  db.approvals = [
    { id: 'SP-2024-001', type: 'requirement', related_id: 'XQ-2024-002', amount: 80000, required_level: 'manager', current_step: 1, status: 'pending', created_at: now },
    { id: 'SP-2024-002', type: 'requirement', related_id: 'XQ-2024-003', amount: 320000, required_level: 'director', current_step: 2, status: 'approved', created_at: now },
  ]

  db.approval_steps = [
    { id: generateId('aps'), approval_id: 'SP-2024-001', step: 1, role: 'manager', approver_id: 'user-2', approver_name: '张经理', status: 'pending', comment: '', acted_at: null },

    { id: generateId('aps'), approval_id: 'SP-2024-002', step: 1, role: 'manager', approver_id: 'user-2', approver_name: '张经理', status: 'approved', comment: '需求合理，同意上报', acted_at: now },
    { id: generateId('aps'), approval_id: 'SP-2024-002', step: 2, role: 'director', approver_id: 'user-6', approver_name: '刘总', status: 'approved', comment: '同意，尽快实施', acted_at: now },
  ]

  db.contracts = [
    { id: 'HT-2024-001', requirement_id: 'XQ-2024-003', inquiry_id: 'XJ-2024-003', supplier_id: 'SP-005', supplier_name: '格力电器', amount: 320000, key_terms: JSON.stringify(['设备到货后付款40%', '安装验收合格后付款40%', '质保期满无问题支付20%质保金']), compliance_passed: 3, compliance_failed: 0, compliance_details: JSON.stringify({budgetCheck: 'pass', qualificationCheck: 'pass', termsCheck: 'pass'}), budget_verified: true, qualification_verified: true, status: 'active', is_offline: 0, file_name: null, signed_at: now, effective_from: '2024-02-01', effective_to: '2024-08-01', created_at: now },
    { id: 'HT-2024-002', requirement_id: 'XQ-2024-004', inquiry_id: 'XJ-2024-004', supplier_id: 'SP-004', supplier_name: '得力文具', amount: 25000, key_terms: JSON.stringify(['货到验收合格后一次性付款']), compliance_passed: 3, compliance_failed: 0, compliance_details: JSON.stringify({budgetCheck: 'pass', qualificationCheck: 'pass', termsCheck: 'pass'}), budget_verified: true, qualification_verified: true, status: 'completed', is_offline: 0, file_name: null, signed_at: now, effective_from: '2024-01-15', effective_to: '2024-02-15', created_at: now },
    { id: 'HT-2024-003', requirement_id: 'XQ-2024-005', inquiry_id: null, supplier_id: 'SP-006', supplier_name: '海康威视', amount: 500000, key_terms: JSON.stringify(['预付款30%', '到货验收后付款50%', '质保金20%']), compliance_passed: 2, compliance_failed: 1, compliance_details: JSON.stringify({budgetCheck: 'pass', qualificationCheck: 'pass', termsCheck: 'warning'}), budget_verified: true, qualification_verified: true, status: 'active', is_offline: 0, file_name: null, signed_at: now, effective_from: '2024-02-10', effective_to: '2024-09-10', created_at: now },
  ]

  db.payment_milestones = [
    { id: generateId('ms'), contract_id: 'HT-2024-001', name: '预付款', amount: 128000, due_date: '2024-02-05', status: 'paid' },
    { id: generateId('ms'), contract_id: 'HT-2024-001', name: '到货款', amount: 128000, due_date: '2024-02-25', status: 'accepted' },
    { id: generateId('ms'), contract_id: 'HT-2024-001', name: '质保金', amount: 64000, due_date: '2024-08-01', status: 'pending' },

    { id: generateId('ms'), contract_id: 'HT-2024-002', name: '全款', amount: 25000, due_date: '2024-01-25', status: 'paid' },

    { id: generateId('ms'), contract_id: 'HT-2024-003', name: '预付款', amount: 150000, due_date: '2024-02-15', status: 'paid' },
    { id: generateId('ms'), contract_id: 'HT-2024-003', name: '到货款', amount: 250000, due_date: '2024-03-20', status: 'pending' },
    { id: generateId('ms'), contract_id: 'HT-2024-003', name: '质保金', amount: 100000, due_date: '2024-09-10', status: 'pending' },
  ]

  const ms1 = db.payment_milestones.find(m => m.name === '到货款' && m.contract_id === 'HT-2024-001')
  const ms2 = db.payment_milestones.find(m => m.name === '全款' && m.contract_id === 'HT-2024-002')
  const ms3 = db.payment_milestones.find(m => m.name === '预付款' && m.contract_id === 'HT-2024-003')

  db.acceptances = [
    { id: generateId('ys'), contract_id: 'HT-2024-001', milestone_id: ms1?.id, delivery_items: JSON.stringify([{name: '中央空调主机', qty: 2}, {name: '末端风机', qty: 15}]), status: 'completed', accepted_at: now, payment_request_id: null },
    { id: generateId('ys'), contract_id: 'HT-2024-002', milestone_id: ms2?.id, delivery_items: JSON.stringify([{name: 'A4打印纸', qty: 500}]), status: 'completed', accepted_at: now, payment_request_id: null },
    { id: generateId('ys'), contract_id: 'HT-2024-003', milestone_id: ms3?.id, delivery_items: JSON.stringify([{name: '企业防火墙', qty: 2}, {name: '入侵检测系统', qty: 1}]), status: 'completed', accepted_at: now, payment_request_id: null },
  ]

  db.payment_requests = [
    { id: generateId('fk'), contract_id: 'HT-2024-001', acceptance_id: db.acceptances[0].id, amount: 128000, status: 'pending', created_at: now, processed_at: null },
    { id: generateId('fk'), contract_id: 'HT-2024-002', acceptance_id: db.acceptances[1].id, amount: 25000, status: 'processed', created_at: now, processed_at: now },
    { id: generateId('fk'), contract_id: 'HT-2024-003', acceptance_id: db.acceptances[2].id, amount: 150000, status: 'processed', created_at: now, processed_at: now },
  ]

  db.acceptances[0].payment_request_id = db.payment_requests[0].id
  db.acceptances[1].payment_request_id = db.payment_requests[1].id
  db.acceptances[2].payment_request_id = db.payment_requests[2].id

  db.operation_logs = [
    { id: generateId('log'), operator_id: 'user-3', operator_name: '李专员', action: '创建需求', target_type: 'requirement', target_id: 'XQ-2024-001', detail: '创建办公电脑采购需求', timestamp: now },
    { id: generateId('log'), operator_id: 'user-3', operator_name: '李专员', action: '创建询价', target_type: 'inquiry', target_id: 'XJ-2024-001', detail: '创建办公电脑采购询价单', timestamp: now },
    { id: generateId('log'), operator_id: 'user-2', operator_name: '张经理', action: '审批通过', target_type: 'approval', target_id: 'SP-2024-002', detail: '空调设备更换需求审批通过（一级）', timestamp: now },
    { id: generateId('log'), operator_id: 'user-6', operator_name: '刘总', action: '审批通过', target_type: 'approval', target_id: 'SP-2024-002', detail: '空调设备更换需求审批通过（终审）', timestamp: now },
    { id: generateId('log'), operator_id: 'user-3', operator_name: '李专员', action: '创建合同', target_type: 'contract', target_id: 'HT-2024-001', detail: '创建空调设备采购合同', timestamp: now },
    { id: generateId('log'), operator_id: 'user-4', operator_name: '王总监', action: '签署合同', target_type: 'contract', target_id: 'HT-2024-001', detail: '电子签署空调设备采购合同', timestamp: now },
    { id: generateId('log'), operator_id: 'user-3', operator_name: '李专员', action: '完成验收', target_type: 'acceptance', target_id: db.acceptances[0].id, detail: '空调设备到货验收完成', timestamp: now },
    { id: generateId('log'), operator_id: 'user-5', operator_name: '赵财务', action: '处理付款', target_type: 'payment', target_id: db.payment_requests[1].id, detail: '打印纸采购款项已支付', timestamp: now },
    { id: generateId('log'), operator_id: 'system', operator_name: '系统', action: '生成预警', target_type: 'alert', target_id: '', detail: '系统自动生成预警通知', timestamp: now },
    { id: generateId('log'), operator_id: 'user-1', operator_name: '系统管理员', action: '用户登录', target_type: 'user', target_id: 'user-1', detail: '系统管理员登录系统', timestamp: now },
  ]

  db.alerts = [
    { id: generateId('alt'), type: 'contract', severity: 'critical', message: '合同HT-2024-015即将到期，请及时处理续约事宜', related_id: 'HT-2024-001', is_read: 0, created_at: now },
    { id: generateId('alt'), type: 'acceptance', severity: 'critical', message: '验收单YS-2024-012超期未处理，请尽快完成验收', related_id: '', is_read: 0, created_at: now },
    { id: generateId('alt'), type: 'inquiry', severity: 'warning', message: '询价单XJ-2024-023报价即将截止，请注意跟进', related_id: 'XJ-2024-001', is_read: 0, created_at: now },
    { id: generateId('alt'), type: 'supplier', severity: 'warning', message: '供应商SP-008资质即将过期，请提醒供应商更新', related_id: 'SP-001', is_read: 1, created_at: now },
    { id: generateId('alt'), type: 'payment', severity: 'warning', message: '付款节点FK-2024-007已到期，请及时安排付款', related_id: db.payment_milestones[0]?.id || '', is_read: 1, created_at: now },
  ]

  const departments = ['采购部', '信息部', '研发部', '行政部', '财务部']
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const statId = generateId('ds')
    db.daily_statistics.push({
      id: statId,
      date: dateStr,
      avg_inquiry_response_hours: 40 + Math.random() * 20,
      avg_contract_signing_days: 3 + Math.random() * 3,
      total_procurement_amount: 100000 + Math.random() * 200000,
      total_contracts: Math.floor(3 + Math.random() * 5),
    })
    departments.forEach(dept => {
      db.department_statistics.push({
        id: generateId('dept'),
        statistic_id: statId,
        department: dept,
        execution_rate: 60 + Math.random() * 35,
      })
    })
  }

  return db
}

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

export function getDB(): Database {
  ensureDirs()
  if (cachedDB) return cachedDB
  if (!fs.existsSync(DB_PATH)) {
    cachedDB = seedDB(getEmptyDB())
    saveDB(cachedDB)
    return cachedDB
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8')
    cachedDB = JSON.parse(raw)
    return cachedDB
  } catch {
    cachedDB = seedDB(getEmptyDB())
    saveDB(cachedDB)
    return cachedDB
  }
}

export function saveDB(db: Database): void {
  ensureDirs()
  cachedDB = db
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

export { generateId }

export function insert(table: keyof Database, record: any): any {
  const db = getDB()
  if (!db[table]) db[table] = []
  ;(db[table] as any[]).push(record)
  saveDB(db)
  return record
}

export function update(table: keyof Database, id: string, patch: any): any | null {
  const db = getDB()
  const list = db[table] as any[]
  const idx = list.findIndex(r => r.id === id)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...patch }
  saveDB(db)
  return list[idx]
}

export function remove(table: keyof Database, id: string): boolean {
  const db = getDB()
  const list = db[table] as any[]
  const idx = list.findIndex(r => r.id === id)
  if (idx === -1) return false
  list.splice(idx, 1)
  saveDB(db)
  return true
}

export function query(table: keyof Database, filterFn?: (r: any) => boolean): any[] {
  const db = getDB()
  const list = db[table] as any[]
  if (!filterFn) return [...list]
  return list.filter(filterFn)
}

export function findOne(table: keyof Database, filterFn: (r: any) => boolean): any | null {
  const db = getDB()
  const list = db[table] as any[]
  return list.find(filterFn) || null
}

export function log(operator_id: string, operator_name: string, action: string, target_type: string, target_id: string, detail: string): void {
  const record = {
    id: generateId('log'),
    operator_id,
    operator_name,
    action,
    target_type,
    target_id,
    detail,
    timestamp: new Date().toISOString(),
  }
  insert('operation_logs', record)
}

export { UPLOADS_DIR, DATA_DIR }
