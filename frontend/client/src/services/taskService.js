import { apiClient } from './apiClient'

export const taskService = {
  async list() {
    const { data } = await apiClient.get('/api/tasks')
    return data
  },
  async create(payload) {
    const { data } = await apiClient.post('/api/tasks', payload)
    return data
  },
  async update(id, payload) {
    const { data } = await apiClient.put(`/api/tasks/${id}`, payload)
    return data
  },
  async remove(id) {
    return apiClient.delete(`/api/tasks/${id}`)
  },
}
