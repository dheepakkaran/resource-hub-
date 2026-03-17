import { useState } from 'react'
import { ExternalLink, Trash2, Download, File, Globe, Pencil } from 'lucide-react'
import TagBadge from './TagBadge'
import CategoryIcon from './CategoryIcon'
import PriorityBadge from './PriorityBadge'
import { filesApi, resourcesApi } from '../api'
import toast from 'react-hot-toast'
import { formatBytes, timeAgo } from '../utils'
import EditResourceModal from './EditResourceModal'

export default function ResourceCard({ resource, onDelete, onUpdate, onTagClick }) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)

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

  const isFile = resource.resource_type === 'file'

  return (
    <>
      <div className="group flex flex-col gap-2 p-3 rounded-xl hover:bg-gray-900 transition-colors">
        {/* Top row: icon + title + actions */}
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center">
            <CategoryIcon category={resource.category} size={14} />
          </div>
          <h3 className="text-sm font-medium text-gray-200 line-clamp-2 leading-snug flex-1">
            {resource.title}
          </h3>
          <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
            {isFile ? (
              <a href={filesApi.downloadUrl(resource.id)} download className="p-1 text-gray-600 hover:text-gray-300 rounded transition-colors">
                <Download size={12} />
              </a>
            ) : (
              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-600 hover:text-gray-300 rounded transition-colors">
                <ExternalLink size={12} />
              </a>
            )}
            <button onClick={() => setEditing(true)} className="p-1 text-gray-600 hover:text-gray-300 rounded transition-colors">
              <Pencil size={12} />
            </button>
            <button onClick={handleDelete} disabled={deleting} className="p-1 text-gray-600 hover:text-red-400 rounded transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Description */}
        {resource.description && (
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed pl-7">
            {resource.description}
          </p>
        )}

        {/* Source */}
        <div className="text-xs text-gray-700 truncate flex items-center gap-1 pl-7">
          {isFile ? (
            <><File size={9} />{resource.file_name} {resource.file_size ? `(${formatBytes(resource.file_size)})` : ''}</>
          ) : (
            <><Globe size={9} />{(() => { try { return new URL(resource.url).hostname } catch { return resource.url } })()}</>
          )}
        </div>

        {/* Tags */}
        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-7">
            {resource.tags.slice(0, 4).map(tag => (
              <TagBadge key={tag} tag={tag} onClick={() => onTagClick?.(tag)} />
            ))}
            {resource.tags.length > 4 && <span className="text-xs text-gray-700">+{resource.tags.length - 4}</span>}
          </div>
        )}

        {/* Priority + date */}
        <div className="flex items-center justify-between pl-7">
          <PriorityBadge resource={resource} onUpdated={onUpdate} size="xs" />
          <p className="text-xs text-gray-700">{timeAgo(resource.created_at)}</p>
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
