package com.auca.thesistrack.service;

import com.auca.thesistrack.dto.slot.CreateSlotRequest;
import com.auca.thesistrack.dto.slot.SlotResponse;
import com.auca.thesistrack.entity.ReviewSlot;
import com.auca.thesistrack.entity.User;
import com.auca.thesistrack.exception.ApiException;
import com.auca.thesistrack.repository.BookingRepository;
import com.auca.thesistrack.repository.ReviewSlotRepository;
import com.auca.thesistrack.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ReviewSlotService {

    private final ReviewSlotRepository reviewSlotRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public ReviewSlotService(ReviewSlotRepository reviewSlotRepository,
                              BookingRepository bookingRepository,
                              UserRepository userRepository) {
        this.reviewSlotRepository = reviewSlotRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SlotResponse> getAvailableSlots() {
        return reviewSlotRepository.findBySlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate.now())
                .stream()
                .filter(slot -> slot.getBookedCount() < slot.getCapacity())
                .map(SlotResponse::from)
                .toList();
    }

    @Transactional
    public SlotResponse createSlot(UUID coordinatorId, CreateSlotRequest request) {
        if (!request.endTime().isAfter(request.startTime())) {
            throw ApiException.badRequest("End time must be after start time");
        }

        User coordinator = userRepository.findById(coordinatorId)
                .orElseThrow(() -> ApiException.notFound("Coordinator not found"));

        ReviewSlot slot = ReviewSlot.builder()
                .createdBy(coordinator)
                .slotDate(request.slotDate())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .capacity(request.capacity())
                .location(request.location())
                .notes(request.notes())
                .build();

        slot = reviewSlotRepository.saveAndFlush(slot);
        return SlotResponse.from(slot);
    }

    @Transactional
    public void cancelSlot(UUID slotId) {
        ReviewSlot slot = reviewSlotRepository.findById(slotId)
                .orElseThrow(() -> ApiException.notFound("Review slot not found"));

        if (bookingRepository.existsBySlotId(slotId)) {
            throw ApiException.conflict("Cannot cancel a slot that has bookings; cancel the individual bookings first");
        }

        reviewSlotRepository.delete(slot);
    }
}
