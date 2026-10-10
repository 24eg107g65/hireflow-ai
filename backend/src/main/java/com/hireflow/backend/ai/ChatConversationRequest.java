package com.hireflow.backend.ai;

import jakarta.validation.constraints.Size;

public record ChatConversationRequest(@Size(max = 160) String title) {
}