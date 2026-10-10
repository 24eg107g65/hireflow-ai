package com.hireflow.backend.note;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByApplication_IdAndUser_IdOrderByCreatedAtDesc(Long applicationId, Long userId);

    Optional<Note> findByIdAndUserId(Long id, Long userId);
}