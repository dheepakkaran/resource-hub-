import clsx from 'clsx'
import { resourcesApi } from '../api'
import toast from 'react-hot-toast'
import { useState } from 'react'

export const PRIORITIES = [
  { key: null,      label: '—',      short: 'None',    dot: 'bg-gray-600',   badge: 'bg-gray-800 text-gray-500 border-gray-700' },
  { key: 'low',     label: 'Low',    short: 'Low',     dot: 'bg-blue-500',   badge: 'bg-blue-950/60 text-blue-300 border-blue-800/60' },
  { key: 'medium',  label: 'Medium', short: 'Med',     dot: 'bg-yellow-500', badge: 'bg-yellow-950/60 text-yellow-300 border-yellow-800/60' },
  { key: 'high',    label: 'High',   short: 'High',    dot: 'bg-orange-500', badge: 'bg-orange-950/60 text-orange-300 border-orange-800/60' },
  { key: 'urgent',  label: 'Important', short: 'Important', dot: 'bg-red-500', badge: 'bg-red-950/60 text-red-300 border-red-800/60' },
]

export function getPriority(key) {
  return PRIORITIES.find(p => p.key === key) || PRIORITIES[0]
}

export default function PriorityBadge({ resource, onUpdated, size = 'sm' }) {
  const [loading, setLoading] = useState(false)
  const current = getPriority(resource.priority)
  const idx = PRIORITIES.findIndex(p => p.key === resource.priority)

  async function cycle(e) {
    e.stopPropagation()
    const next = PRIORITIES[(idx + 1) % PRIORITIES.length]
    setLoading(true)
    try {
      const updated = await resourcesApi.update(resource.id, { priority: next.key })
      onUpdated?.(updated)
    } catch {
      toast.error('Failed to update priority')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={cycle}
      disabled={loading}
      title={`Priority: ${current.label} — click to change`}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border font-medium transition-all hover:scale-105 disabled:opacity-50',
        current.badge,
        size === 'xs' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'
      )}
    >
      <span className={clsx('rounded-full flex-shrink-0', current.dot, size === 'xs' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {current.label === '—' ? 'Set priority' : current.label}
    </button>
  )
}
