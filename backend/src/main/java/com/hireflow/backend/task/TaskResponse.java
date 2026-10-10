package com.hireflow.backend.task;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TaskResponse(Long id, Long applicationId, String title, LocalDate dueDate,
        boolean completed, TaskPriority priority,
        LocalDateTime createdAt, LocalDateTime updatedAt) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(task.getId(), task.getApplication() == null ? null : task.getApplication().getId(),
                task.getTitle(), task.getDueDate(), task.isCompleted(), task.getPriority(),
                task.getCreatedAt(), task.getUpdatedAt());
    }
}