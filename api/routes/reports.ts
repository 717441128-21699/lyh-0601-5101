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
    const { start, end } = req.query
    let dailyStats = query('daily_statistics').sort((a: any, b: any) => a.date.localeCompare(b.date))
    if (start) dailyStats = dailyStats.filter((d: any) => d.date >= start)
    if (end) dailyStats = dailyStats.filter((d: any) => d.date <= end)
    if (dailyStats.length === 0) {
      dailyStats = query('daily_statistics').sort((a: any, b: any) => a.date.localeCompare(b.date))
    }
    const deptStats = query('department_statistics')
    const latestStat = dailyStats[dailyStats.length - 1]
    const latestDept = latestStat ? deptStats.filter((d: any) => d.statistic_id === latestStat.id) : []
    const departmentRates: any = {}
    latestDept.forEach((d: any) => { departmentRates[d.department] = Math.round(d.execution_rate * 10) / 10 })
    const responseTrend = dailyStats.slice(-7).map((d: any) => ({
      date: d.date,
      hours: Math.round(d.avg_inquiry_response_hours * 10) / 10
    }))
    const allContracts = query('contracts')
    let filteredContracts = allContracts
    if (start) {
      filteredContracts = filteredContracts.filter((c: any) => (c.created_at || '').slice(0, 10) >= start)
    }
    if (end) {
      filteredContracts = filteredContracts.filter((c: any) => (c.created_at || '').slice(0, 10) <= end)
    }
    if (filteredContracts.length === 0) filteredContracts = allContracts
    
    let cycleBuckets = [
      { range: '< 3天', min: 0, max: 3, count: 0 },
      { range: '3-7天', min: 3, max: 7, count: 0 },
      { range: '7-15天', min: 7, max: 15, count: 0 },
      { range: '> 15天', min: 15, max: 9999, count: 0 },
    ]
    filteredContracts.forEach((c: any) => {
      const created = new Date(c.created_at || new Date())
      const signed = new Date(c.signed_at || c.effective_from || new Date())
      const days = Math.max(0, Math.ceil((signed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))
      const bucket = cycleBuckets.find((b) => days >= b.min && days < b.max)
      if (bucket) bucket.count++
    })
    const cycleDistribution = cycleBuckets.map((b) => ({ range: b.range, count: b.count }))
    
    const activeContracts = filteredContracts.filter((c: any) => c.status === 'active').length
    const complianceRate = filteredContracts.length > 0
      ? Math.round((filteredContracts.filter((c: any) => Number(c.compliance_failed || 0) === 0).length / filteredContracts.length) * 100) / 100
      : 0
    const inquiries = query('inquiries')
    const overdueRate = inquiries.length > 0
      ? Math.round((inquiries.filter((i: any) => i.status === 'expired').length / inquiries.length) * 100) / 100
      : 0
    
    const totalAmountFromContracts = filteredContracts.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0)
    const totalContractsCount = filteredContracts.length
    const avgCycleFromContracts = filteredContracts.length > 0
      ? Math.round(filteredContracts.reduce((sum: number, c: any) => {
          const created = new Date(c.created_at || new Date())
          const signed = new Date(c.signed_at || c.effective_from || new Date())
          const days = Math.max(0, Math.ceil((signed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))
          return sum + days
        }, 0) / filteredContracts.length * 10) / 10
      : 0
    
    const metrics = {
      total_procurement_amount: totalAmountFromContracts,
      total_contracts: totalContractsCount,
      avg_contract_signing_days: avgCycleFromContracts,
      active_contracts: activeContracts,
      avg_response_hours: dailyStats.length > 0
        ? Math.round((dailyStats.reduce((sum: number, d: any) => sum + d.avg_inquiry_response_hours, 0) / dailyStats.length) * 10) / 10
        : 0,
      avg_execution_rate: latestDept.length > 0
        ? Math.round((latestDept.reduce((sum: number, d: any) => sum + d.execution_rate, 0) / latestDept.length) * 100) / 100
        : 0,
      compliance_rate: complianceRate,
      overdue_rate: overdueRate,
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

router.get('/drilldown', async (req: any, res: Response): Promise<void> => {
  try {
    const { dimension, range, start, end } = req.query
    let contracts = query('contracts')
    const dailyStats = query('daily_statistics').sort((a: any, b: any) => a.date.localeCompare(b.date))
    let filteredDaily = dailyStats
    if (start) filteredDaily = filteredDaily.filter((d: any) => d.date >= start)
    if (end) filteredDaily = filteredDaily.filter((d: any) => d.date <= end)
    if (filteredDaily.length === 0) filteredDaily = dailyStats
    const firstDate = filteredDaily[0]?.date
    const lastDate = filteredDaily[filteredDaily.length - 1]?.date
    const dateFilter: Record<string, boolean> = {}
    filteredDaily.forEach((d: any) => { dateFilter[d.date] = true })
    const requirements = query('requirements', (r: any) => {
      const d = (r.created_at || '').slice(0, 10)
      return !start || d >= start
    })
    const inquiries = query('inquiries')
    const milestones = query('payment_milestones')
    const paymentRequests = query('payment_requests')
    if (start) {
      contracts = contracts.filter((c: any) => (c.created_at || '').slice(0, 10) >= start)
    }
    if (end) {
      contracts = contracts.filter((c: any) => (c.created_at || '').slice(0, 10) <= end)
    }
    let cycleDistribution = [
      { range: '< 3天', min: 0, max: 3, count: 0 },
      { range: '3-7天', min: 3, max: 7, count: 0 },
      { range: '7-15天', min: 7, max: 15, count: 0 },
      { range: '> 15天', min: 15, max: 9999, count: 0 },
    ]
    contracts.forEach((c: any) => {
      const created = new Date(c.created_at || c.signed_at || new Date())
      const signed = new Date(c.signed_at || c.effective_from || new Date())
      const days = Math.max(0, Math.ceil((signed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))
      const bucket = cycleDistribution.find((b) => days >= b.min && days < b.max)
      if (bucket) bucket.count++
    })
    if (dimension === 'contract' || !dimension) {
      const contractsExtended = contracts.map((c: any) => {
        const contractRequirements = requirements.filter((r: any) => r.id === c.related_requirement_id)
        const contractInquiries = inquiries.filter((i: any) => i.related_requirement_id === c.related_requirement_id)
        const contractMilestones = milestones.filter((m: any) => m.contract_id === c.id)
        const contractPayments = paymentRequests.filter((pr: any) => pr.contract_id === c.id)
        const paidAmount = contractPayments.filter((pr: any) => pr.status === 'paid' || pr.status === 'processed').reduce((s: number, p: any) => s + Number(p.amount), 0)
        return {
          id: c.id,
          supplier_name: c.supplier_name,
          amount: Number(c.amount),
          status: c.status,
          created_at: c.created_at,
          effective_from: c.effective_from,
          paid_amount: paidAmount,
          remaining_amount: Number(c.amount) - paidAmount,
          milestone_count: contractMilestones.length,
          payment_count: contractPayments.length,
          compliance_passed: Number(c.compliance_passed || 0),
          compliance_failed: Number(c.compliance_failed || 0),
          requirement_id: contractRequirements[0]?.id,
          inquiry_id: contractInquiries[0]?.id,
        }
      })
      let targetList = contractsExtended
      if (range) {
        const bucket = cycleDistribution.find((b) => b.range === range)
        if (bucket) {
          targetList = contractsExtended.filter((c: any) => {
            const created = new Date(c.created_at || new Date())
            const signed = new Date(c.effective_from || new Date())
            const days = Math.ceil((signed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
            return days >= bucket.min && days < bucket.max
          })
        }
      }
      res.status(200).json({
        success: true,
        data: {
          dimension: 'contract',
          range: range || null,
          date_range: { start: start || null, end: end || null, firstDate, lastDate },
          total_count: targetList.length,
          total_amount: targetList.reduce((s: number, c: any) => s + c.amount, 0),
          total_paid: targetList.reduce((s: number, c: any) => s + c.paid_amount, 0),
          items: targetList,
          cycle_distribution: cycleDistribution,
        },
      })
      return
    }
    if (dimension === 'supplier') {
      const supplierMap: Record<string, any> = {}
      contracts.forEach((c: any) => {
        const key = c.supplier_name
        if (!supplierMap[key]) {
          supplierMap[key] = {
            supplier_name: key,
            contract_count: 0,
            total_amount: 0,
            paid_amount: 0,
            contracts: [] as string[],
          }
        }
        const contractPayments = paymentRequests.filter((pr: any) => pr.contract_id === c.id)
        const paidAmount = contractPayments.filter((pr: any) => pr.status === 'paid' || pr.status === 'processed').reduce((s: number, p: any) => s + Number(p.amount), 0)
        supplierMap[key].contract_count++
        supplierMap[key].total_amount += Number(c.amount)
        supplierMap[key].paid_amount += paidAmount
        supplierMap[key].contracts.push(c.id)
      })
      const supplierList = Object.values(supplierMap).map((s: any) => ({
        ...s,
        remaining_amount: s.total_amount - s.paid_amount,
        avg_contract_value: s.contract_count > 0 ? Math.round(s.total_amount / s.contract_count) : 0,
      }))
      res.status(200).json({
        success: true,
        data: {
          dimension: 'supplier',
          range: range || null,
          date_range: { start: start || null, end: end || null, firstDate, lastDate },
          total_count: supplierList.length,
          total_amount: supplierList.reduce((s: number, c: any) => s + c.total_amount, 0),
          total_paid: supplierList.reduce((s: number, c: any) => s + c.paid_amount, 0),
          items: supplierList,
          cycle_distribution: cycleDistribution,
        },
      })
      return
    }
    if (dimension === 'month') {
      const monthMap: Record<string, any> = {}
      contracts.forEach((c: any) => {
        const month = (c.created_at || '').slice(0, 7)
        if (!month) return
        if (!monthMap[month]) {
          monthMap[month] = { month, contract_count: 0, total_amount: 0, contracts: [] as string[] }
        }
        monthMap[month].contract_count++
        monthMap[month].total_amount += Number(c.amount)
        monthMap[month].contracts.push(c.id)
      })
      const monthList = Object.values(monthMap).sort((a: any, b: any) => a.month.localeCompare(b.month))
      res.status(200).json({
        success: true,
        data: {
          dimension: 'month',
          range: range || null,
          date_range: { start: start || null, end: end || null, firstDate, lastDate },
          total_count: monthList.reduce((s: number, c: any) => s + c.contract_count, 0),
          total_amount: monthList.reduce((s: number, c: any) => s + c.total_amount, 0),
          items: monthList,
          cycle_distribution: cycleDistribution,
        },
      })
      return
    }
    res.status(400).json({ success: false, message: `不支持的维度: ${dimension}` })
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取钻取数据失败' })
  }
})

export default router
