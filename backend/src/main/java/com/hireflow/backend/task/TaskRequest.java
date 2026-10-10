package com.hireflow.backend.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record TaskRequest(@NotBlank @Size(max = 250) String title, LocalDate dueDate,
        Boolean completed, TaskPriority priority, Long applicationId) {
}