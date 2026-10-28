package com.auca.thesistrack.dto.slot;

import com.auca.thesistrack.entity.ReviewSlot;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

public record SlotResponse(
        UUID id,
        LocalDate slotDate,
        LocalTime startTime,
        LocalTime endTime,
        int capacity,
        int bookedCount,
        int spotsAvailable,
        String location,
        String notes,
        LocalDateTime createdAt
) {
    public static SlotResponse from(ReviewSlot slot) {
        return new SlotResponse(
                slot.getId(),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getCapacity(),
                slot.getBookedCount(),
                Math.max(slot.getCapacity() - slot.getBookedCount(), 0),
                slot.getLocation(),
                slot.getNotes(),
                slot.getCreatedAt()
        );
    }
}
