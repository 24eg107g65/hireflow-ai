package com.hireflow.backend.ai;

import java.time.LocalDateTime;

public record ChatConversationResponse(Long id, String title, LocalDateTime createdAt, LocalDateTime updatedAt) {
    public static ChatConversationResponse from(ChatConversation conversation) {
        return new ChatConversationResponse(conversation.getId(), conversation.getTitle(), conversation.getCreatedAt(),
                conversation.getUpdatedAt());
    }
}