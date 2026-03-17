import { Globe, File, LayoutGrid } from 'lucide-react'
import CategoryIcon from './CategoryIcon'
import TagBadge from './TagBadge'
import clsx from 'clsx'

export default function Sidebar({ filters, setFilters, categories, tags }) {
  function setType(t) {
    setFilters(f => ({ ...f, resource_type: f.resource_type === t ? undefined : t }))
  }
  function setCategory(c) {
    setFilters(f => ({ ...f, category: f.category === c ? undefined : c }))
  }
  function setTag(t) {
    setFilters(f => ({ ...f, tag: f.tag === t ? undefined : t }))
  }

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col gap-6 scrollbar-thin overflow-y-auto py-2">
      {/* Type filter */}
      <section>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Type</p>
        <div className="space-y-0.5">
          {[
            { label: 'All', value: undefined, icon: LayoutGrid },
            { label: 'URLs', value: 'url', icon: Globe },
            { label: 'Files', value: 'file', icon: File },
          ].map(({ label, value, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setType(value)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                filters.resource_type === value
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Category</p>
          <div className="space-y-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left capitalize',
                  filters.category === cat
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                )}
              >
                <CategoryIcon category={cat} size={15} />
                {cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Tags — colorful TagBadge */}
      {tags.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 40).map(tag => (
              <TagBadge
                key={tag}
                tag={tag}
                active={filters.tag === tag}
                onClick={() => setTag(tag)}
              />
            ))}
          </div>
        </section>
      )}
    </aside>
  )
}
