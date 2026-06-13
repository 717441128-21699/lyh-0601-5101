import { Router, type Request, type Response } from 'express'
import { query, findOne, update } from '../database.js'

const router = Router()

router.get('/logs/export', async (req: any, res: Response): Promise<void> => {
  try {
    const { start, end } = req.query
    let logs = query('operation_logs').sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp))
    if (start) logs = logs.filter((l: any) => l.timestamp >= start)
    if (end) logs = logs.filter((l: any) => l.timestamp <= end + 'T23:59:59')
    const lines: string[] = []
    lines.push('ID,操作人,操作,目标类型,目标ID,详情,时间')
    logs.forEach((l: any) => {
      lines.push([
        l.id,
        l.operator_name,
        l.action,
        l.target_type,
        l.target_id,
        `"${(l.detail || '').replace(/"/g, '""')}"`,
        l.timestamp
      ].join(','))
    })
    const content = lines.join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename=operation_logs_${Date.now()}.csv`)
    res.status(200).send('\uFEFF' + content)
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '导出日志失败' })
  }
})

router.get('/logs', async (req: any, res: Response): Promise<void> => {
  try {
    const { action, operator, target, date } = req.query
    let logs = query('operation_logs').sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp))
    if (action) logs = logs.filter((l: any) => l.action.includes(action as string))
    if (operator) logs = logs.filter((l: any) => l.operator_name.includes(operator as string))
    if (target) logs = logs.filter((l: any) => l.target_type.includes(target as string))
    if (date) logs = logs.filter((l: any) => l.timestamp.startsWith(date as string))
    res.status(200).json({ success: true, data: logs })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取日志列表失败' })
  }
})

router.get('/alerts', async (req: any, res: Response): Promise<void> => {
  try {
    const alerts = query('alerts').sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
    const unreadCount = alerts.filter((a: any) => a.is_read === 0).length
    res.status(200).json({ success: true, data: alerts, unreadCount })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取预警列表失败' })
  }
})

router.post('/alerts/:id/read', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const alert = findOne('alerts', (x: any) => x.id === id)
    if (!alert) {
      res.status(404).json({ success: false, message: '预警不存在' })
      return
    }
    const updated = update('alerts', id, { is_read: 1 })
    res.status(200).json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '标记已读失败' })
  }
})

export default router
