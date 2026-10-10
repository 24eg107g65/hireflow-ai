package com.hireflow.backend.task;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserIdOrderByDueDateAscCreatedAtDesc(Long userId);

    List<Task> findTop10ByUserIdAndDueDateGreaterThanEqualAndCompletedFalseOrderByDueDateAsc(Long userId,
            LocalDate from);

    List<Task> findTop10ByUserIdAndDueDateLessThanAndCompletedFalseOrderByDueDateAsc(Long userId, LocalDate before);

    List<Task> findByUserIdAndCompletedFalseOrderByDueDateAsc(Long userId);

    List<Task> findTop20ByUserIdAndCompletedFalseOrderByDueDateAsc(Long userId);

    Optional<Task> findByIdAndUserId(Long id, Long userId);
}