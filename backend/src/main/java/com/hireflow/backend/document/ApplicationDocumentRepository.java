package com.hireflow.backend.document;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, Long> {
    List<ApplicationDocument> findByApplication_IdAndUser_IdOrderByUploadedAtDesc(Long applicationId, Long userId);

    Optional<ApplicationDocument> findByIdAndUser_Id(Long id, Long userId);

    List<ApplicationDocument> findTop5ByUser_IdOrderByUploadedAtDesc(Long userId);
}