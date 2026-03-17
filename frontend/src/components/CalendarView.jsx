import { useState } from 'react'
import { ChevronLeft, ChevronRight, Globe, File } from 'lucide-react'
import TagBadge from './TagBadge'
import PriorityBadge from './PriorityBadge'
import { getPriority } from './PriorityBadge'
import clsx from 'clsx'
import { timeAgo } from '../utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarView({ resources, onUpdate, onTagClick }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)

  // Group resources by YYYY-MM-DD
  const grouped = {}
  for (const r of resources) {
    const d = r.created_at.split('T')[0]
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(r)
  }

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  function cellKey(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const selectedResources = selectedDate ? (grouped[selectedDate] || []) : []

  return (
    <div className="flex flex-col gap-6">
      {/* Calendar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-white">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs text-gray-600 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />
            const key = cellKey(day)
            const count = grouped[key]?.length || 0
            const isToday = key === todayKey
            const isSelected = key === selectedDate

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                className={clsx(
                  'relative flex flex-col items-center justify-start py-1.5 rounded-xl transition-all min-h-[52px]',
                  isSelected ? 'bg-gray-700 ring-1 ring-gray-500' :
                  isToday ? 'bg-gray-800 ring-1 ring-gray-600' :
                  count ? 'hover:bg-gray-800 cursor-pointer' : 'hover:bg-gray-800/40 cursor-default'
                )}
              >
                <span className={clsx(
                  'text-xs font-medium',
                  isToday ? 'text-white' : count ? 'text-gray-200' : 'text-gray-600'
                )}>{day}</span>

                {count > 0 && (
                  <div className="flex flex-wrap justify-center gap-0.5 mt-1 px-0.5">
                    {grouped[key].slice(0, 4).map(r => {
                      const p = getPriority(r.priority)
                      return <span key={r.id} className={clsx('w-1.5 h-1.5 rounded-full', p.dot)} />
                    })}
                    {count > 4 && <span className="text-xs text-gray-500">+</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-4 pt-4 border-t border-gray-800">
          <span className="text-xs text-gray-600">Priority:</span>
          {[{dot:'bg-gray-600',label:'None'},{dot:'bg-blue-500',label:'Low'},{dot:'bg-yellow-500',label:'Med'},{dot:'bg-orange-500',label:'High'},{dot:'bg-red-500',label:'Urgent'}].map(({dot,label})=>(
            <span key={label} className="flex items-center gap-1 text-xs text-gray-500">
              <span className={clsx('w-2 h-2 rounded-full', dot)} />{label}
            </span>
          ))}
        </div>
      </div>

      {/* Selected day resources */}
      {selectedDate && (
        <div>
          <p className="text-sm font-medium text-gray-400 mb-3">
            {selectedResources.length} resource{selectedResources.length !== 1 ? 's' : ''} saved on <span className="text-white">{selectedDate}</span>
          </p>
          {selectedResources.length === 0 ? (
            <p className="text-gray-600 text-sm">Nothing saved on this day.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedResources.map(r => (
                <CalendarResourceRow key={r.id} resource={r} onUpdate={onUpdate} onTagClick={onTagClick} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All resources this month (when nothing selected) */}
      {!selectedDate && (
        <div>
          <p className="text-xs text-gray-600 mb-3">
            {Object.entries(grouped).filter(([k]) => k.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).reduce((s,[,v])=>s+v.length,0)} resources in {MONTHS[month]}
          </p>
        </div>
      )}
    </div>
  )
}

function CalendarResourceRow({ resource, onUpdate, onTagClick }) {
  const isFile = resource.resource_type === 'file'
  return (
    <div className="flex items-start gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors">
      <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
        {isFile ? <File size={12} className="text-gray-500" /> : <Globe size={12} className="text-gray-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-100 truncate">{resource.title}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {resource.tags.slice(0,2).map(t=><TagBadge key={t} tag={t} onClick={()=>onTagClick?.(t)} />)}
          <PriorityBadge resource={resource} onUpdated={onUpdate} size="xs" />
          <span className="text-xs text-gray-600">{timeAgo(resource.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
