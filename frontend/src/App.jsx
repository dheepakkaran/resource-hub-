import { useState, useRef, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { Plus, Search, X, Loader2, LayoutGrid, List, Calendar, Flag } from 'lucide-react'
import ResourceCard from './components/ResourceCard'
import ListView from './components/ListView'
import CalendarView from './components/CalendarView'
import PriorityView from './components/PriorityView'
import AddResourceModal from './components/AddResourceModal'
import TagsBar from './components/TagsBar'
import { useResources, useTags } from './hooks/useResources'
import clsx from 'clsx'

const VIEWS = [
  { key: 'card',     icon: LayoutGrid },
  { key: 'list',     icon: List },
  { key: 'calendar', icon: Calendar },
  { key: 'priority', icon: Flag },
]

export default function App() {
  const [showAdd, setShowAdd]       = useState(false)
  const [search, setSearch]         = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeTag, setActiveTag]   = useState(null)
  const [view, setView]             = useState('card')
  const searchRef = useRef(null)

  const queryFilters = { search: search || undefined, tag: activeTag || undefined }
  const { resources, loading, error, refetch } = useResources(queryFilters)
  const tags = useTags()

  function handleAdded()       { refetch() }
  function handleDelete()      { refetch() }
  function handleUpdate()      { refetch() }
  function handleTagClick(tag) { setActiveTag(t => t === tag ? null : tag) }

  function openSearch() {
    setSearchOpen(true)
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  function closeSearch() {
    setSearchOpen(false)
    setSearch('')
  }

  // Close search on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && searchOpen) closeSearch() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen])

  const hasActiveFilters = activeTag || search

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#111827', color: '#f3f4f6', border: '1px solid #374151' },
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2 sm:gap-3">

          {/* Logo — hidden when search open on mobile */}
          <span className={`text-base font-bold text-white tracking-tight flex-shrink-0 ${searchOpen ? 'hidden sm:inline' : ''}`}>
            ResourceHub
          </span>

          {!searchOpen && <div className="flex-1" />}

          {/* Combined toolbar: search popout + view icons */}
          <div className={`flex items-center gap-1 ${searchOpen ? 'flex-1' : ''}`}>
            {searchOpen ? (
              /* Expanded search input — full width on mobile */
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 flex-1">
                <Search size={14} className="text-gray-500 flex-shrink-0" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none flex-1"
                />
                <button onClick={closeSearch} className="text-gray-600 hover:text-gray-300 flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ) : (
              /* Icon row: search + view switcher */
              <>
                <IconBtn onClick={openSearch} title="Search">
                  <Search size={16} />
                </IconBtn>
                {VIEWS.map(({ key, icon: Icon }) => (
                  <IconBtn
                    key={key}
                    onClick={() => setView(key)}
                    active={view === key}
                    title={key}
                  >
                    <Icon size={16} />
                  </IconBtn>
                ))}
              </>
            )}
          </div>

          {/* + button — far right */}
          <button
            onClick={() => setShowAdd(true)}
            title="Add resource"
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white hover:bg-gray-200 text-gray-900 rounded-lg transition-colors ml-1"
          >
            <Plus size={17} />
          </button>
        </div>
      </header>

      {/* Tags bar */}
      <div className="sticky top-14 z-20">
        <TagsBar tags={tags} activeTag={activeTag} onTagClick={handleTagClick} />
      </div>

      {/* Content */}
      <div className="flex-1 max-w-screen-xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6">

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeTag && <FilterChip label={`Tag: ${activeTag}`} onRemove={() => setActiveTag(null)} />}
            {search && <FilterChip label={`"${search}"`} onRemove={closeSearch} />}
            <button onClick={() => { setActiveTag(null); closeSearch() }} className="text-xs text-gray-600 hover:text-gray-300 transition-colors">
              Clear all
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-gray-600" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-gray-400">Failed to load resources</p>
            <button onClick={refetch} className="text-gray-500 hover:text-white text-sm underline">Retry</button>
          </div>
        )}

        {!loading && !error && resources.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <p className="text-gray-400 font-medium">
              {hasActiveFilters ? 'No results found' : 'Nothing saved yet'}
            </p>
            <p className="text-gray-700 text-sm">
              {hasActiveFilters ? 'Try a different tag or search' : 'Click + to add a URL or file'}
            </p>
          </div>
        )}

        {!loading && !error && resources.length > 0 && (
          <>
            {view === 'card' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {resources.map(r => (
                  <ResourceCard key={r.id} resource={r} onDelete={handleDelete} onUpdate={handleUpdate} onTagClick={handleTagClick} />
                ))}
              </div>
            )}
            {view === 'list' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2">
                <ListView resources={resources} onDelete={handleDelete} onUpdate={handleUpdate} onTagClick={handleTagClick} />
              </div>
            )}
            {view === 'calendar' && (
              <CalendarView resources={resources} onUpdate={handleUpdate} onTagClick={handleTagClick} />
            )}
            {view === 'priority' && (
              <PriorityView resources={resources} onDelete={handleDelete} onUpdate={handleUpdate} onTagClick={handleTagClick} />
            )}
          </>
        )}
      </div>

      {showAdd && <AddResourceModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}
    </div>
  )
}

function IconBtn({ onClick, active, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'w-8 h-8 flex items-center justify-center rounded-lg transition-colors',
        active ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800'
      )}
    >
      {children}
    </button>
  )
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 bg-gray-800 text-gray-400 text-xs px-2.5 py-1 rounded-full border border-gray-700">
      {label}
      <button onClick={onRemove} className="hover:text-white"><X size={10} /></button>
    </span>
  )
}
