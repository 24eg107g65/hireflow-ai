import { apiClient } from './apiClient'

let activeConversationId = null

export const assistantService = {
  async ask(message, context = {}) {
    if (!activeConversationId) {
      const { data: conversation } = await apiClient.post('/api/ai/chat/conversations', { title: message.slice(0, 80) })
      activeConversationId = conversation.id
    }
    const { data } = await apiClient.post(`/api/ai/chat/conversations/${activeConversationId}/messages`, { content: message, ...context })
    return { ...data, answer: data.assistantMessage?.content }
  },
  async insight(action, { applicationId }) {
    const paths = {
      summarize: 'analyze-job',
      skills: 'analyze-job',
      'compare-resume': 'compare-resume',
      'interview-questions': 'generate-interview-questions',
      'follow-up-email': 'draft-follow-up-email',
    }
    const endpoint = paths[action]
    if (!endpoint) throw new Error('This AI action is not supported.')
    const { data } = await apiClient.post(`/api/ai/applications/${applicationId}/${endpoint}`)
    return data
  },
  resetConversation() { activeConversationId = null },
}