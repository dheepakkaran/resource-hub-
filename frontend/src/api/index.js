import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const resourcesApi = {
  list:    (params) => api.get('/resources', { params }).then(r => r.data),
  preview: (url)    => api.post('/resources/preview', { url }).then(r => r.data),
  create: (payload) => api.post('/resources', payload).then(r => r.data),
  update: (id, payload) => api.patch(`/resources/${id}`, payload).then(r => r.data),
  delete: (id) => api.delete(`/resources/${id}`).then(r => r.data),
  tags: () => api.get('/resources/tags').then(r => r.data),
  categories: () => api.get('/resources/categories').then(r => r.data),
}

export const filesApi = {
  upload: (file, opts = {}) => {
    const form = new FormData()
    form.append('file', file)
    if (opts.title) form.append('custom_title', opts.title)
    if (opts.tags?.length) form.append('custom_tags', JSON.stringify(opts.tags))
    return api.post('/files', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  downloadUrl: (id) => `/api/files/download/${id}`,
}
