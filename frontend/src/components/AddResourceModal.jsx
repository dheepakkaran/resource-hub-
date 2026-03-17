import { useState, useRef, useEffect } from 'react'
import { X, Link, Upload, Plus, Loader2, CloudUpload, Sparkles } from 'lucide-react'
import { resourcesApi, filesApi } from '../api'
import TagBadge from './TagBadge'
import toast from 'react-hot-toast'

export default function AddResourceModal({ onClose, onAdded }) {
  const [mode, setMode]               = useState('url')
  const [url, setUrl]                 = useState('')
  const [file, setFile]               = useState(null)
  const [customTitle, setCustomTitle] = useState('')
  const [tagInput, setTagInput]       = useState('')
  const [manualTags, setManualTags]   = useState([])
  const [autoTags, setAutoTags]       = useState([])
  const [previewing, setPreviewing]   = useState(false)
  const [previewDone, setPreviewDone] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [dragOver, setDragOver]       = useState(false)
  // track which tags are "new" for pop animation
  const [newTagKeys, setNewTagKeys]   = useState(new Set())
  const fileRef  = useRef()
  const debounce = useRef(null)
  const prevAutoTags = useRef([])

  // ── Debounced URL preview ────────────────────────────────────────────────
  useEffect(() => {
    const trimmed  = url.trim()
    const finalUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`

    if (!trimmed || trimmed.length < 8) {
      setAutoTags([]); setPreviewDone(false)
      setPreviewing(false); clearTimeout(debounce.current)
      prevAutoTags.current = []
      return
    }
    clearTimeout(debounce.current)
    setPreviewing(true); setPreviewDone(false)

    debounce.current = setTimeout(async () => {
      try {
        const data = await resourcesApi.preview(finalUrl)
        const incoming = data.tags || []

        // figure out which are brand-new
        const oldSet = new Set(prevAutoTags.current)
        const brandNew = new Set(incoming.filter(t => !oldSet.has(t)))
        setNewTagKeys(brandNew)
        setTimeout(() => setNewTagKeys(new Set()), 600) // clear after animation

        setAutoTags(incoming)
        prevAutoTags.current = incoming

        if (!customTitle && data.title && data.title !== finalUrl)
          setCustomTitle(data.title)
        setPreviewDone(true)
      } catch {
        setAutoTags([])
      } finally {
        setPreviewing(false)
      }
    }, 700)

    return () => clearTimeout(debounce.current)
  }, [url])

  // ── File extension instant tags ──────────────────────────────────────────
  useEffect(() => {
    if (!file) { setAutoTags([]); prevAutoTags.current = []; return }
    const ext = file.name.split('.').pop()?.toLowerCase()
    const extMap = {
      pdf:'pdf,document', doc:'document', docx:'document',
      mp4:'video,mp4', mov:'video', avi:'video',
      mp3:'audio', wav:'audio',
      png:'image', jpg:'image', jpeg:'image', gif:'image', svg:'image',
      py:'code,python', js:'code,javascript', ts:'code,typescript',
      go:'code,golang', rs:'code,rust', java:'code,java',
      cpp:'code,cpp', cs:'code,csharp', rb:'code,ruby', php:'code,php',
      sh:'code,bash', sql:'code,sql', ipynb:'code,jupyter,notebook',
      zip:'archive', tar:'archive', gz:'archive', md:'markdown,document',
    }
    const tags = (extMap[ext] || ext || '').split(',').filter(Boolean)
    setNewTagKeys(new Set(tags))
    setTimeout(() => setNewTagKeys(new Set()), 600)
    setAutoTags(tags)
    prevAutoTags.current = tags
  }, [file])

  const allTags = [...new Set([...autoTags, ...manualTags])]

  function addManualTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !allTags.includes(t)) {
      setManualTags(prev => [...prev, t])
      setNewTagKeys(new Set([t]))
      setTimeout(() => setNewTagKeys(new Set()), 400)
    }
    setTagInput('')
  }

  function removeTag(tag) {
    if (manualTags.includes(tag)) setManualTags(t => t.filter(x => x !== tag))
    else setAutoTags(t => t.filter(x => x !== tag))
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setMode('file') }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      let resource
      if (mode === 'url') {
        if (!url.trim()) { toast.error('Enter a URL'); setLoading(false); return }
        const finalUrl = url.startsWith('http') ? url : `https://${url}`
        resource = await resourcesApi.create({
          url: finalUrl,
          custom_title: customTitle || undefined,
          custom_tags:  manualTags,
        })
      } else {
        if (!file) { toast.error('Select a file'); setLoading(false); return }
        resource = await filesApi.upload(file, { title: customTitle || undefined, tags: manualTags })
      }
      onAdded(resource)
      toast.success('Saved!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const hasAnyTags = allTags.length > 0 || previewing

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Add to ResourceHub</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-5 mt-4 bg-gray-800 p-1 rounded-xl">
          {[['url', Link, 'URL'], ['file', Upload, 'File']].map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === key ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* URL / File input */}
          {mode === 'url' ? (
            <div className="relative">
              <input
                autoFocus
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors pr-9"
              />
              {previewing && (
                <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-600" />
              )}
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl py-5 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                dragOver ? 'border-gray-500 bg-gray-800/60' : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <CloudUpload size={24} className="text-gray-600" />
              <p className="text-xs text-gray-500">
                {file ? file.name : 'Drop or click to upload'}
              </p>
              <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
            </div>
          )}

          {/* Title */}
          <input
            value={customTitle}
            onChange={e => setCustomTitle(e.target.value)}
            placeholder="Title (auto-detected)"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
          />

          {/* ── Tags Panel ──────────────────────────────────────────── */}
          <div className={`rounded-xl border transition-all duration-300 ${
            hasAnyTags ? 'border-gray-700 bg-gray-800/40' : 'border-gray-800 bg-gray-800/20'
          }`}>

            {/* Auto tags row */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={12} className="text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 font-medium">Auto-detected</span>
                {previewing && (
                  <span className="text-xs text-gray-700 italic">fetching…</span>
                )}
                {previewDone && !previewing && autoTags.length > 0 && (
                  <span className="text-xs text-gray-700">{autoTags.length} tags found</span>
                )}
              </div>

              {/* Skeleton shimmer */}
              {previewing && (
                <div className="flex flex-wrap gap-2">
                  {[52, 68, 44, 80, 56].map((w, i) => (
                    <span
                      key={i}
                      className="h-6 rounded-full bg-gray-700/80 animate-pulse"
                      style={{ width: w, animationDelay: `${i * 80}ms` }}
                    />
                  ))}
                </div>
              )}

              {/* Actual auto tags */}
              {!previewing && autoTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {autoTags.map(tag => (
                    <span
                      key={tag}
                      className={newTagKeys.has(tag) ? 'tag-pop' : ''}
                      style={newTagKeys.has(tag) ? {
                        animationDelay: `${[...newTagKeys].indexOf(tag) * 40}ms`
                      } : {}}
                    >
                      <TagBadge tag={tag} onClick={() => removeTag(tag)} />
                    </span>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!previewing && autoTags.length === 0 && (
                <p className="text-xs text-gray-700 italic py-1">
                  {mode === 'url'
                    ? previewDone ? 'No tags detected' : 'Paste a URL — tags will appear here'
                    : 'Upload a file to detect tags'}
                </p>
              )}
            </div>

            {/* Divider only if both sections have content */}
            {(autoTags.length > 0 || manualTags.length > 0) && (
              <div className="mx-4 border-t border-gray-700/50" />
            )}

            {/* Manual tags row */}
            <div className="px-4 pb-3 pt-3">
              {manualTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {manualTags.map(tag => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 bg-gray-700 text-gray-200 text-xs px-2.5 py-1 rounded-full ${
                        newTagKeys.has(tag) ? 'tag-pop' : ''
                      }`}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add tag input */}
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addManualTag())}
                  placeholder="Add your own tag…"
                  className="flex-1 bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={addManualTag}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSubmit}
            disabled={loading || (mode === 'url' ? !url.trim() : !file)}
            className="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-900 disabled:opacity-40 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
