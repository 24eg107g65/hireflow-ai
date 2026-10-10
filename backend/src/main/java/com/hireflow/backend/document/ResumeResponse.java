package com.hireflow.backend.document;

import java.time.LocalDateTime;

public record ResumeResponse(Long id, String originalFilename, String contentType, long sizeBytes, boolean isDefault,
        LocalDateTime uploadedAt, String contentPath) {
    public static ResumeResponse from(Resume resume) {
        return new ResumeResponse(resume.getId(), resume.getOriginalFilename(), resume.getContentType(),
                resume.getSizeBytes(), resume.isDefaultResume(), resume.getUploadedAt(),
                "/api/resumes/" + resume.getId() + "/content");
    }
}