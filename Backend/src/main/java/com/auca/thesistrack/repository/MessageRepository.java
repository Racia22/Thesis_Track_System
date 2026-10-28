package com.auca.thesistrack.repository;

import com.auca.thesistrack.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByThesisIdOrderBySentAtAsc(UUID thesisId);

    List<Message> findByThesisIdAndSenderIdNotAndReadAtIsNull(UUID thesisId, UUID senderId);
}
