package com.hireflow.backend.document;

import java.time.LocalDateTime;

public record FileResponse(Long id, Long applicationId, String originalFilename, String contentType,
        long sizeBytes, boolean defaultResume, LocalDateTime uploadedAt) {
    public static FileResponse from(Resume resume) {
        return new FileResponse(resume.getId(), null, resume.getOriginalFilename(), resume.getContentType(),
                resume.getSizeBytes(), resume.isDefaultResume(), resume.getUploadedAt());
    }

    public static FileResponse from(ApplicationDocument document) {
        return new FileResponse(document.getId(), document.getApplicationId(), document.getOriginalFilename(),
                document.getContentType(), document.getSizeBytes(), false, document.getUploadedAt());
    }
}