package com.hireflow.backend.ai;

public record ChatExchangeResponse(ChatMessageResponse userMessage, ChatMessageResponse assistantMessage) {
}