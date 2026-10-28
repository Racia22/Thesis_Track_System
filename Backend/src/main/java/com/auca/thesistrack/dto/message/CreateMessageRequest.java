package com.auca.thesistrack.dto.message;

import jakarta.validation.constraints.NotBlank;

public record CreateMessageRequest(
        @NotBlank(message = "Message content is required")
        String content
) {
}
