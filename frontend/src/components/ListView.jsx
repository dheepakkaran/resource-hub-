import { ExternalLink, Download, Pencil, Trash2, File, Globe } from 'lucide-react'
import TagBadge from './TagBadge'
import PriorityBadge from './PriorityBadge'
import CategoryIcon from './CategoryIcon'
import { filesApi, resourcesApi } from '../api'
import { timeAgo, formatBytes } from '../utils'
import { useState } from 'react'
import toast from 'react-hot-toast'
import EditResourceModal from './EditResourceModal'

export default function ListView({ resources, onDelete, onUpdate, onTagClick }) {
  return (
    <div className="flex flex-col divide-y divide-gray-800/60">
      {resources.map(r => (
        <ListRow
          key={r.id}
          resource={r}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  )
}

function ListRow({ resource, onDelete, onUpdate, onTagClick }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isFile = resource.resource_type === 'file'

  async function handleDelete() {
    if (!confirm('Delete this resource?')) return
    setDeleting(true)
    try {
      await resourcesApi.delete(resource.id)
      onDelete(resource.id)
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="group flex items-center gap-4 py-3 px-2 hover:bg-gray-900/50 rounded-xl transition-colors">
        {/* Icon */}
        <div className="w-8 h-8 flex-shrink-0 bg-gray-800 rounded-lg flex items-center justify-center">
          {isFile ? <File size={14} className="text-gray-500" /> : <CategoryIcon category={resource.category} size={14} />}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-100 truncate">{resource.title}</span>
            {resource.category && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-gray-600 flex-shrink-0">
                <CategoryIcon category={resource.category} size={11} />
                {resource.category}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600 truncate mt-0.5 flex items-center gap-1">
            {isFile ? (
              <><File size={9} /> {resource.file_name} {resource.file_size ? `(${formatBytes(resource.file_size)})` : ''}</>
            ) : (
              <><Globe size={9} /> {(() => { try { return new URL(resource.url).hostname } catch { return resource.url } })()}</>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0 max-w-[200px] flex-wrap">
          {resource.tags.slice(0, 3).map(tag => (
            <TagBadge key={tag} tag={tag} onClick={() => onTagClick?.(tag)} />
          ))}
          {resource.tags.length > 3 && <span className="text-xs text-gray-600">+{resource.tags.length - 3}</span>}
        </div>

        {/* Priority */}
        <div className="flex-shrink-0">
          <PriorityBadge resource={resource} onUpdated={onUpdate} size="xs" />
        </div>

        {/* Date */}
        <span className="hidden lg:block text-xs text-gray-600 flex-shrink-0 w-16 text-right">{timeAgo(resource.created_at)}</span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
          {isFile ? (
            <a href={filesApi.downloadUrl(resource.id)} download className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors" title="Download">
              <Download size={14} />
            </a>
          ) : (
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors" title="Open">
              <ExternalLink size={14} />
            </a>
          )}
          <button onClick={() => setEditing(true)} className="p-1.5 text-gray-500 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={handleDelete} disabled={deleting} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors" title="Delete">
            <Trash2 size={14} />
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
