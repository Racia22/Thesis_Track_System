package com.auca.thesistrack.dto.thesis;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignSupervisorRequest(
        @NotNull(message = "Supervisor id is required")
        UUID supervisorId
) {
}
