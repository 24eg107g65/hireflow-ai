package com.hireflow.backend.document;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByUser_IdOrderByUploadedAtDesc(Long userId);

    Optional<Resume> findByIdAndUser_Id(Long id, Long userId);

    Optional<Resume> findFirstByUser_IdAndDefaultResumeTrue(Long userId);

    @Modifying
    @Query("update Resume r set r.defaultResume = false where r.user.id = :userId")
    void clearDefaultForUser(@Param("userId") Long userId);
}