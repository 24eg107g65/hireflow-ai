import { apiClient } from './apiClient'

export const documentService = {
  async listForApplication(applicationId) {
    const { data } = await apiClient.get(`/api/applications/${applicationId}/documents`)
    return data
  },
  async uploadForApplication(applicationId, file) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post(`/api/applications/${applicationId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  async download(id) {
    const response = await apiClient.get(`/api/documents/${id}/download`, { responseType: 'blob' })
    return response.data
  },
  async remove(id) {
    return apiClient.delete(`/api/documents/${id}`)
  },
}
