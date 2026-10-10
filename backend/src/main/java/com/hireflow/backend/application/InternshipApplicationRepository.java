package com.hireflow.backend.application;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InternshipApplicationRepository
        extends JpaRepository<InternshipApplication, Long>, JpaSpecificationExecutor<InternshipApplication> {
    Optional<InternshipApplication> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, ApplicationStatus status);

    List<InternshipApplication> findTop5ByUserIdOrderByUpdatedAtDesc(Long userId);

    List<InternshipApplication> findTop10ByUserIdAndDeadlineGreaterThanEqualAndStatusNotInOrderByDeadlineAsc(
            Long userId, LocalDate from, List<ApplicationStatus> excludedStatuses);
}