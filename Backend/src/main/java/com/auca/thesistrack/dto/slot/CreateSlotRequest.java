package com.auca.thesistrack.dto.slot;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateSlotRequest(
        @NotNull(message = "Slot date is required")
        @Future(message = "Slot date must be in the future")
        LocalDate slotDate,

        @NotNull(message = "Start time is required")
        LocalTime startTime,

        @NotNull(message = "End time is required")
        LocalTime endTime,

        @Min(value = 1, message = "Capacity must be at least 1")
        Integer capacity,

        String location,

        String notes
) {
}
