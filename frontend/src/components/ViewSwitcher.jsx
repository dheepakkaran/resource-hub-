import { LayoutGrid, List, Calendar, Flag } from 'lucide-react'
import clsx from 'clsx'

const VIEWS = [
  { key: 'card',     label: 'Card',     icon: LayoutGrid },
  { key: 'list',     label: 'List',     icon: List },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'priority', label: 'Priority', icon: Flag },
]

export default function ViewSwitcher({ view, setView }) {
  return (
    <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-xl">
      {VIEWS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setView(key)}
          title={label}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            view === key
              ? 'bg-gray-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
          )}
        >
          <Icon size={14} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
