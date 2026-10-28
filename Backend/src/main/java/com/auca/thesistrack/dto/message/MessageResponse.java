package com.auca.thesistrack.dto.message;

import com.auca.thesistrack.entity.Message;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID thesisId,
        UUID senderId,
        String senderName,
        String senderRole,
        String content,
        LocalDateTime sentAt,
        LocalDateTime readAt
) {
    public static MessageResponse from(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getThesis().getId(),
                message.getSender().getId(),
                message.getSender().getName(),
                message.getSender().getRole().name(),
                message.getContent(),
                message.getSentAt(),
                message.getReadAt()
        );
    }
}
