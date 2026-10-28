package com.auca.thesistrack.dto.booking;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateBookingRequest(
        @NotNull(message = "Slot id is required")
        UUID slotId
) {
}
