import clsx from 'clsx'

const COLORS = [
  'bg-blue-900/60 text-blue-300 ring-blue-700/40',
  'bg-violet-900/60 text-violet-300 ring-violet-700/40',
  'bg-emerald-900/60 text-emerald-300 ring-emerald-700/40',
  'bg-amber-900/60 text-amber-300 ring-amber-700/40',
  'bg-rose-900/60 text-rose-300 ring-rose-700/40',
  'bg-cyan-900/60 text-cyan-300 ring-cyan-700/40',
  'bg-pink-900/60 text-pink-300 ring-pink-700/40',
  'bg-indigo-900/60 text-indigo-300 ring-indigo-700/40',
]

function hashTag(tag) {
  let h = 0
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % COLORS.length
}

export default function TagBadge({ tag, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 transition-all',
        COLORS[hashTag(tag)],
        active ? 'ring-2 scale-105' : 'hover:scale-105',
        onClick ? 'cursor-pointer' : 'cursor-default'
      )}
    >
      {tag}
    </button>
  )
}
