package com.auca.thesistrack.service;

import com.auca.thesistrack.dto.message.MessageResponse;
import com.auca.thesistrack.entity.Message;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.User;
import com.auca.thesistrack.entity.enums.NotificationType;
import com.auca.thesistrack.exception.ApiException;
import com.auca.thesistrack.repository.MessageRepository;
import com.auca.thesistrack.repository.ThesisRepository;
import com.auca.thesistrack.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ThesisRepository thesisRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public MessageService(MessageRepository messageRepository,
                          ThesisRepository thesisRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.messageRepository = messageRepository;
        this.thesisRepository = thesisRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getThread(UUID thesisId, UUID requesterId) {
        Thesis thesis = thesisRepository.findById(thesisId)
                .orElseThrow(() -> ApiException.notFound("Thesis not found"));
        assertAccess(thesis, requesterId);

        return messageRepository.findByThesisIdOrderBySentAtAsc(thesisId)
                .stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Transactional
    public MessageResponse sendMessage(UUID thesisId, UUID senderId, String content) {
        Thesis thesis = thesisRepository.findById(thesisId)
                .orElseThrow(() -> ApiException.notFound("Thesis not found"));
        assertAccess(thesis, senderId);

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> ApiException.notFound("Sender not found"));

        User recipient;
        if (thesis.getStudent().getId().equals(senderId)) {
            recipient = thesis.getSupervisor();
            if (recipient == null) {
                throw ApiException.conflict("You don't have a supervisor assigned yet");
            }
        } else {
            recipient = thesis.getStudent();
        }

        Message message = Message.builder()
                .thesis(thesis)
                .sender(sender)
                .content(content)
                .build();
        message = messageRepository.saveAndFlush(message);

        notificationService.notify(
                recipient,
                "New message",
                sender.getName() + " sent you a message about \"" + thesis.getTitle() + "\".",
                NotificationType.NEW_MESSAGE
        );

        return MessageResponse.from(message);
    }

    @Transactional
    public void markThreadRead(UUID thesisId, UUID requesterId) {
        Thesis thesis = thesisRepository.findById(thesisId)
                .orElseThrow(() -> ApiException.notFound("Thesis not found"));
        assertAccess(thesis, requesterId);

        List<Message> unread = messageRepository.findByThesisIdAndSenderIdNotAndReadAtIsNull(thesisId, requesterId);
        LocalDateTime now = LocalDateTime.now();
        unread.forEach(m -> m.setReadAt(now));
        messageRepository.saveAll(unread);
    }

    private void assertAccess(Thesis thesis, UUID userId) {
        boolean isStudent = thesis.getStudent().getId().equals(userId);
        boolean isSupervisor = thesis.getSupervisor() != null && thesis.getSupervisor().getId().equals(userId);
        if (!isStudent && !isSupervisor) {
            throw ApiException.forbidden("You do not have access to this conversation");
        }
    }
}
