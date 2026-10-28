package com.auca.thesistrack.controller;

import com.auca.thesistrack.dto.message.CreateMessageRequest;
import com.auca.thesistrack.dto.message.MessageResponse;
import com.auca.thesistrack.security.UserPrincipal;
import com.auca.thesistrack.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/{thesisId}")
    public ResponseEntity<List<MessageResponse>> getThread(@AuthenticationPrincipal UserPrincipal principal,
                                                            @PathVariable UUID thesisId) {
        return ResponseEntity.ok(messageService.getThread(thesisId, principal.getId()));
    }

    @PostMapping("/{thesisId}")
    public ResponseEntity<MessageResponse> sendMessage(@AuthenticationPrincipal UserPrincipal principal,
                                                        @PathVariable UUID thesisId,
                                                        @Valid @RequestBody CreateMessageRequest request) {
        MessageResponse response = messageService.sendMessage(thesisId, principal.getId(), request.content());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{thesisId}/read")
    public ResponseEntity<Void> markThreadRead(@AuthenticationPrincipal UserPrincipal principal,
                                                @PathVariable UUID thesisId) {
        messageService.markThreadRead(thesisId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
