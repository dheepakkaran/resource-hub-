import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { resourcesApi } from '../api'
import toast from 'react-hot-toast'

export default function EditResourceModal({ resource, onClose, onSaved }) {
  const [title, setTitle] = useState(resource.title)
  const [description, setDescription] = useState(resource.description || '')
  const [category, setCategory] = useState(resource.category || '')
  const [tags, setTags] = useState(resource.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await resourcesApi.update(resource.id, {
        title,
        description: description || null,
        category: category || null,
        tags,
      })
      onSaved(updated)
      toast.success('Saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Edit Resource</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-xs text-gray-400 mb-1 block">Title</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
            />
          </label>

          <label className="block">
            <span className="text-xs text-gray-400 mb-1 block">Description</span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 resize-none transition-colors"
            />
          </label>

          <label className="block">
            <span className="text-xs text-gray-400 mb-1 block">Category</span>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. code, article, video..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
            />
          </label>

          <div>
            <span className="text-xs text-gray-400 mb-1 block">Tags</span>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-gray-700 text-gray-200 text-xs px-2 py-0.5 rounded-full">
                  {tag}
                  <button onClick={() => setTags(t => t.filter(x => x !== tag))} className="hover:text-white"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
              />
              <button onClick={addTag} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
