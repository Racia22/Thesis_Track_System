package com.auca.thesistrack.dto.booking;

import com.auca.thesistrack.dto.slot.SlotResponse;
import com.auca.thesistrack.entity.Booking;

import java.time.LocalDateTime;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID thesisId,
        String thesisTitle,
        String studentName,
        SlotResponse slot,
        String status,
        String reviewerNotes,
        LocalDateTime bookedAt,
        LocalDateTime completedAt
) {
    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getThesis().getId(),
                booking.getThesis().getTitle(),
                booking.getThesis().getStudent().getName(),
                SlotResponse.from(booking.getSlot()),
                booking.getStatus().name(),
                booking.getReviewerNotes(),
                booking.getBookedAt(),
                booking.getCompletedAt()
        );
    }
}
