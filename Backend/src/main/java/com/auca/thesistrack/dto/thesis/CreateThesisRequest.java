package com.auca.thesistrack.dto.thesis;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateThesisRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 500, message = "Title must be at most 500 characters")
        String title,

        String description
) {
}
