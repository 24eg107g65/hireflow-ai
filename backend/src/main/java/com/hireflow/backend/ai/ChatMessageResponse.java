package com.hireflow.backend.ai;

import java.time.LocalDateTime;

public record ChatMessageResponse(Long id, String sender, String content, LocalDateTime createdAt) {
    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(message.getId(), message.getSender().name(), message.getContent(),
                message.getCreatedAt());
    }
}