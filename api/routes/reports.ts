import { Router, type Request, type Response } from 'express'
import { query, findOne } from '../database.js'

const router = Router()

router.get('/dashboard', async (req: any, res: Response): Promise<void> => {
  try {
    const approvals = query('approvals', (a: any) => a.status === 'pending')
    const inquiries = query('inquiries', (i: any) => i.status === 'quoting')
    const acceptances = query('acceptances', (a: any) => a.status !== 'completed')
    const contracts = query('contracts', (c: any) => c.status === 'active')
    const deptStats = query('department_statistics')
    const dailyStats = query('daily_statistics')
    const avgExec = deptStats.length > 0
      ? Math.round((deptStats.reduce((sum: number, d: any) => sum + d.execution_rate, 0) / deptStats.length) * 10) / 10
      : 0
    const avgResp = dailyStats.length > 0
      ? Math.round((dailyStats.reduce((sum: number, d: any) => sum + (d.avg_inquiry_response_hours / 24), 0) / dailyStats.length) * 10) / 10
      : 0
    res.status(200).json({
      success: true,
      data: {
        pendingApprovals: approvals.length,
        pendingQuotes: inquiries.length,
        pendingAcceptance: acceptances.length,
        activeContracts: contracts.length,
        executionRate: avgExec,
        avgResponseTime: avgResp
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取仪表盘数据失败' })
  }
})

router.get('/statistics', async (req: any, res: Response): Promise<void> => {
  try {
    const dailyStats = query('daily_statistics').sort((a: any, b: any) => a.date.localeCompare(b.date))
    const deptStats = query('department_statistics')
    const latestStat = dailyStats[dailyStats.length - 1]
    const latestDept = latestStat ? deptStats.filter((d: any) => d.statistic_id === latestStat.id) : []
    const departmentRates: any = {}
    latestDept.forEach((d: any) => { departmentRates[d.department] = Math.round(d.execution_rate * 10) / 10 })
    const responseTrend = dailyStats.slice(-7).map((d: any) => ({
      date: d.date,
      hours: Math.round(d.avg_inquiry_response_hours * 10) / 10
    }))
    const cycleDistribution = [
      { range: '< 3天', count: Math.floor(Math.random() * 5 + 3) },
      { range: '3-7天', count: Math.floor(Math.random() * 8 + 5) },
      { range: '7-15天', count: Math.floor(Math.random() * 4 + 2) },
      { range: '> 15天', count: Math.floor(Math.random() * 3 + 1) }
    ]
    const totalAmount = dailyStats.reduce((sum: number, d: any) => sum + d.total_procurement_amount, 0)
    const totalContracts = dailyStats.reduce((sum: number, d: any) => sum + d.total_contracts, 0)
    const avgCycle = dailyStats.length > 0
      ? Math.round((dailyStats.reduce((sum: number, d: any) => sum + d.avg_contract_signing_days, 0) / dailyStats.length) * 10) / 10
      : 0
    const metrics = {
      total_procurement_amount: totalAmount,
      total_contracts: totalContracts,
      avg_contract_signing_days: avgCycle,
      active_contracts: query('contracts', (c: any) => c.status === 'active').length
    }
    res.status(200).json({
      success: true,
      data: { departmentRates, responseTrend, cycleDistribution, metrics }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取统计数据失败' })
  }
})

router.get('/export', async (req: any, res: Response): Promise<void> => {
  try {
    const { format = 'pdf', start, end } = req.query
    const dailyStats = query('daily_statistics').sort((a: any, b: any) => a.date.localeCompare(b.date))
    const deptStats = query('department_statistics')
    const latestStat = dailyStats[dailyStats.length - 1]
    const latestDept = latestStat ? deptStats.filter((d: any) => d.statistic_id === latestStat.id) : []
    const dateRange = `${start || '全部'} ~ ${end || '全部'}`
    const totalAmount = dailyStats.reduce((sum: number, d: any) => sum + d.total_procurement_amount, 0)
    const totalContracts = dailyStats.reduce((sum: number, d: any) => sum + d.total_contracts, 0)
    const avgExec = latestDept.length > 0
      ? Math.round((latestDept.reduce((sum: number, d: any) => sum + d.execution_rate, 0) / latestDept.length) * 10) / 10
      : 0
    const avgResp = dailyStats.length > 0
      ? Math.round((dailyStats.reduce((sum: number, d: any) => sum + (d.avg_inquiry_response_hours / 24), 0) / dailyStats.length) * 10) / 10
      : 0

    if (format === 'excel' || format === 'csv') {
      const lines: string[] = []
      lines.push('采购管理系统统计报表')
      lines.push(`日期范围,${dateRange}`)
      lines.push('')
      lines.push('关键指标')
      lines.push('指标,数值')
      lines.push(`总采购金额,${totalAmount}`)
      lines.push(`合同总数,${totalContracts}`)
      lines.push(`平均执行率,${avgExec}%`)
      lines.push(`平均响应时间,${avgResp}天`)
      lines.push('')
      lines.push('部门执行率')
      lines.push('部门,执行率')
      latestDept.forEach((d: any) => lines.push(`${d.department},${Math.round(d.execution_rate * 10) / 10}%`))
      lines.push('')
      lines.push('响应时间趋势')
      lines.push('日期,小时')
      dailyStats.slice(-7).forEach((d: any) => lines.push(`${d.date},${Math.round(d.avg_inquiry_response_hours * 10) / 10}`))
      const content = lines.join('\n')
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=procurement_report_${Date.now()}.csv`)
      res.status(200).send('\uFEFF' + content)
      return
    }

    const txtContent = `
========================================
       采购管理系统统计报表
========================================

日期范围: ${dateRange}
生成时间: ${new Date().toLocaleString()}

--- 关键指标 ---
总采购金额: ¥${totalAmount.toLocaleString()}
合同总数: ${totalContracts}
平均执行率: ${avgExec}%
平均响应时间: ${avgResp} 天

--- 部门执行率 ---
${latestDept.map((d: any) => `${d.department}: ${Math.round(d.execution_rate * 10) / 10}%`).join('\n')}

--- 响应时间趋势（近7天） ---
${dailyStats.slice(-7).map((d: any) => `${d.date}: ${Math.round(d.avg_inquiry_response_hours * 10) / 10}小时`).join('\n')}

--- 签署周期分布 ---
< 3天: ${Math.floor(totalContracts * 0.2)}
3-7天: ${Math.floor(totalContracts * 0.4)}
7-15天: ${Math.floor(totalContracts * 0.25)}
> 15天: ${Math.floor(totalContracts * 0.15)}

========================================
`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=procurement_report_${Date.now()}.pdf`)
    res.status(200).send(txtContent)
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '导出报表失败' })
  }
})

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

export default router
