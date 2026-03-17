import TagBadge from './TagBadge'
import { X } from 'lucide-react'

export default function TagsBar({ tags, activeTag, onTagClick }) {
  if (!tags.length) return null

  return (
    <div className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-gray-600 font-medium flex-shrink-0 mr-0.5">Tags</span>
        {tags.map(tag => (
          <TagBadge
            key={tag}
            tag={tag}
            active={activeTag === tag}
            onClick={() => onTagClick(tag)}
          />
        ))}
        {activeTag && (
          <button
            onClick={() => onTagClick(activeTag)}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-200 transition-colors ml-1"
          >
            <X size={12} /> clear
          </button>
        )}
      </div>
    </div>
  )
}
