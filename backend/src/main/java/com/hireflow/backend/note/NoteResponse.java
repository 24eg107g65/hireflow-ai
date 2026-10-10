package com.hireflow.backend.note;

import java.time.LocalDateTime;

public record NoteResponse(Long id, Long applicationId, String content,
        LocalDateTime createdAt, LocalDateTime updatedAt) {
    public static NoteResponse from(Note note) {
        return new NoteResponse(note.getId(), note.getApplicationId(), note.getContent(), note.getCreatedAt(),
                note.getUpdatedAt());
    }
}