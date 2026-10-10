package com.hireflow.backend.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import org.hibernate.validator.constraints.URL;

@Schema(description = "Fields used to create or update an internship application")
public record ApplicationRequest(@NotBlank @Size(max = 150) String companyName,
        @NotBlank @Size(max = 150) String jobRole,
        @URL(message = "Application link must be a valid URL") @Size(max = 2048) String applicationLink,
        LocalDate deadline, @NotNull ApplicationStatus status,
        @Size(max = 100000) String jobDescription,
        @Size(max = 100000) String notes) {
}