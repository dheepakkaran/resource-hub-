import { Flag } from 'lucide-react'
import TagBadge from './TagBadge'
import PriorityBadge, { PRIORITIES } from './PriorityBadge'
import { filesApi, resourcesApi } from '../api'
import { timeAgo } from '../utils'
import { useState } from 'react'
import toast from 'react-hot-toast'
import EditResourceModal from './EditResourceModal'
import { ExternalLink, Download, Pencil, Trash2, File, Globe } from 'lucide-react'
import clsx from 'clsx'

const COLUMN_STYLES = {
  urgent: 'border-red-900/60',
  high:   'border-orange-900/60',
  medium: 'border-yellow-900/60',
  low:    'border-blue-900/60',
  null:   'border-gray-800',
}
const HEADER_STYLES = {
  urgent: 'text-red-400', // displayed as "Important"
  high:   'text-orange-400',
  medium: 'text-yellow-400',
  low:    'text-gray-400',
  null:   'text-gray-500',
}

export default function PriorityView({ resources, onDelete, onUpdate, onTagClick }) {
  const grouped = {}
  for (const p of PRIORITIES) grouped[String(p.key)] = []
  for (const r of resources) grouped[String(r.priority)] = [...(grouped[String(r.priority)] || []), r]

  return (
    <div className="flex gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:overflow-visible items-start scrollbar-thin">
      {PRIORITIES.slice().reverse().map(p => {
        const key = String(p.key)
        const items = grouped[key] || []
        return (
          <div key={key} className={clsx('flex flex-col gap-2 bg-gray-900/50 border rounded-2xl p-3 flex-shrink-0 w-64 sm:w-auto', COLUMN_STYLES[key] || 'border-gray-800')}>
            {/* Column header */}
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2">
                <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', p.dot)} />
                <span className={clsx('text-xs font-semibold uppercase tracking-wide', HEADER_STYLES[key] || 'text-gray-500')}>
                  {p.label === '—' ? 'Unset' : p.label}
                </span>
              </div>
              <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full">{items.length}</span>
            </div>

            {items.length === 0 && (
              <div className="flex items-center justify-center py-6 text-gray-700 text-xs">Empty</div>
            )}

            {items.map(r => (
              <PriorityCard key={r.id} resource={r} onDelete={onDelete} onUpdate={onUpdate} onTagClick={onTagClick} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function PriorityCard({ resource, onDelete, onUpdate, onTagClick }) {
  const [editing, setEditing] = useState(false)
  const isFile = resource.resource_type === 'file'

  async function handleDelete() {
    if (!confirm('Delete?')) return
    try {
      await resourcesApi.delete(resource.id)
      onDelete(resource.id)
      toast.success('Deleted')
    } catch {
      toast.error('Failed')
    }
  }

  return (
    <>
      <div className="group bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-3 flex flex-col gap-2 transition-colors">
        {/* Favicon + title */}
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
            {isFile ? <File size={13} className="text-gray-500" /> : <Globe size={13} className="text-gray-500" />}
          </div>
          <p className="text-xs font-medium text-gray-100 line-clamp-2 leading-snug">{resource.title}</p>
        </div>

        {/* Tags */}
        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map(t => <TagBadge key={t} tag={t} onClick={() => onTagClick?.(t)} />)}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-1">
          <PriorityBadge resource={resource} onUpdated={onUpdate} size="xs" />
          <span className="text-xs text-gray-700">{timeAgo(resource.created_at)}</span>
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {isFile ? (
            <a href={filesApi.downloadUrl(resource.id)} download className="p-1 text-gray-500 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors">
              <Download size={12} />
            </a>
          ) : (
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-500 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors">
              <ExternalLink size={12} />
            </a>
          )}
          <button onClick={() => setEditing(true)} className="p-1 text-gray-500 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors">
            <Pencil size={12} />
          </button>
          <button onClick={handleDelete} className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {editing && (
        <EditResourceModal
          resource={resource}
          onClose={() => setEditing(false)}
          onSaved={updated => { onUpdate(updated); setEditing(false) }}
        />
      )}
    </>
  )
}
