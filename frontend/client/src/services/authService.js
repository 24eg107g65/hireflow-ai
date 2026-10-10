import { apiClient } from './apiClient'

export const authService = {
  async login(credentials) {
    const { data } = await apiClient.post('/api/auth/login', credentials)
    return data
  },
  async register(payload) {
    const { data } = await apiClient.post('/api/auth/register', payload)
    return data
  },
  async me() {
    const { data } = await apiClient.get('/api/users/me')
    return data
  },
  async updateProfile(payload) {
    const { data } = await apiClient.put('/api/users/me', payload)
    return data
  },
}