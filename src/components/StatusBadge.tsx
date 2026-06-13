import { cn } from '@/lib/utils'

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-yellow-50 text-yellow-700' },
  in_inquiry: { label: '询价中', className: 'bg-blue-50 text-blue-700' },
  in_approval: { label: '审批中', className: 'bg-purple-50 text-purple-700' },
  contracted: { label: '已签约', className: 'bg-emerald-50 text-emerald-700' },
  completed: { label: '已完成', className: 'bg-green-50 text-green-700' },
  draft: { label: '草稿', className: 'bg-gray-50 text-gray-600' },
  sent: { label: '已发送', className: 'bg-blue-50 text-blue-700' },
  quoting: { label: '报价中', className: 'bg-indigo-50 text-indigo-700' },
  evaluated: { label: '已评标', className: 'bg-cyan-50 text-cyan-700' },
  closed: { label: '已关闭', className: 'bg-gray-100 text-gray-500' },
  approved: { label: '已批准', className: 'bg-green-50 text-green-700' },
  rejected: { label: '已驳回', className: 'bg-red-50 text-red-700' },
  signing: { label: '签署中', className: 'bg-amber-50 text-amber-700' },
  active: { label: '生效中', className: 'bg-emerald-50 text-emerald-700' },
  voided: { label: '已作废', className: 'bg-gray-100 text-gray-500' },
  compliance_checking: { label: '合规校验中', className: 'bg-orange-50 text-orange-700' },
  pending_acceptance: { label: '待验收', className: 'bg-yellow-50 text-yellow-700' },
  accepted: { label: '已验收', className: 'bg-green-50 text-green-700' },
  payment_requested: { label: '已申请付款', className: 'bg-blue-50 text-blue-700' },
  paid: { label: '已付款', className: 'bg-emerald-50 text-emerald-700' },
  processing: { label: '处理中', className: 'bg-blue-50 text-blue-700' },
  warning: { label: '警告', className: 'bg-orange-50 text-orange-700' },
  critical: { label: '严重', className: 'bg-red-50 text-red-700' },
}

const colorMap: Record<string, string> = {
  success: 'bg-green-50 text-green-700',
  danger: 'bg-red-50 text-red-700',
  warning: 'bg-yellow-50 text-yellow-700',
  info: 'bg-blue-50 text-blue-700',
  default: 'bg-gray-50 text-gray-600',
  primary: 'bg-primary-50 text-primary-700',
  gold: 'bg-amber-50 text-amber-700',
}

interface StatusBadgeProps {
  status: string
  className?: string
  color?: string
}

export default function StatusBadge({ status, className, color }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: color ? colorMap[color] || 'bg-gray-50 text-gray-600' : 'bg-gray-50 text-gray-600' }
  const colorClass = color ? colorMap[color] : config.className
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {config.label}
    </span>
  )
}
