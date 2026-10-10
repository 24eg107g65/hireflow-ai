package com.hireflow.backend.ai;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {
    List<ChatConversation> findByUser_IdOrderByUpdatedAtDesc(Long userId);

    Optional<ChatConversation> findByIdAndUser_Id(Long id, Long userId);
}