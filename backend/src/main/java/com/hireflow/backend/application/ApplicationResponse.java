package com.hireflow.backend.application;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ApplicationResponse(Long id, String companyName, String jobRole, String applicationLink,
        LocalDate deadline, ApplicationStatus status, String jobDescription,
        String notes, LocalDateTime createdAt, LocalDateTime updatedAt) {
    public static ApplicationResponse from(InternshipApplication application) {
        return new ApplicationResponse(application.getId(), application.getCompanyName(), application.getJobRole(),
                application.getApplicationLink(), application.getDeadline(), application.getStatus(),
                application.getJobDescription(), application.getNotes(), application.getCreatedAt(),
                application.getUpdatedAt());
    }
}