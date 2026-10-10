import { apiClient } from './apiClient'

export const applicationService = {
  async list(params = {}) {
    const { data } = await apiClient.get('/api/applications', { params })
    return data
  },
  async get(id) {
    const { data } = await apiClient.get(`/api/applications/${id}`)
    return data
  },
  async create(payload) {
    const { data } = await apiClient.post('/api/applications', payload)
    return data
  },
  async update(id, payload) {
    const { data } = await apiClient.put(`/api/applications/${id}`, payload)
    return data
  },
  async remove(id) {
    return apiClient.delete(`/api/applications/${id}`)
  },
}