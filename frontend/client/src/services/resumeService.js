import { apiClient } from './apiClient'

export const resumeService = {
  async list() {
    const response = await apiClient.get('/api/resumes')
    return response.data
  },
  async upload(file) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/api/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  async setDefault(id) {
    await apiClient.put(`/api/resumes/${id}/default`)
  },
  async remove(id) {
    await apiClient.delete(`/api/resumes/${id}`)
  },
  async content(id) {
    const response = await apiClient.get(`/api/resumes/${id}/content`, { responseType: 'blob' })
    return response.data
  },
}