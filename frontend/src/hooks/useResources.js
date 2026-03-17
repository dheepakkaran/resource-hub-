import { useState, useEffect, useCallback } from 'react'
import { resourcesApi } from '../api'

export function useResources(filters) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await resourcesApi.list(filters)
      setResources(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => { fetch() }, [fetch])

  return { resources, loading, error, refetch: fetch }
}

export function useTags() {
  const [tags, setTags] = useState([])
  useEffect(() => {
    resourcesApi.tags().then(setTags).catch(() => {})
  }, [])
  return tags
}

export function useCategories() {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    resourcesApi.categories().then(setCategories).catch(() => {})
  }, [])
  return categories
}
