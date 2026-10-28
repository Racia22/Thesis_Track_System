package com.auca.thesistrack.service;

import com.auca.thesistrack.dto.booking.BookingResponse;
import com.auca.thesistrack.entity.Booking;
import com.auca.thesistrack.entity.ReviewSlot;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.enums.BookingStatus;
import com.auca.thesistrack.entity.enums.NotificationType;
import com.auca.thesistrack.entity.enums.ThesisStatus;
import com.auca.thesistrack.exception.ApiException;
import com.auca.thesistrack.repository.BookingRepository;
import com.auca.thesistrack.repository.ReviewSlotRepository;
import com.auca.thesistrack.repository.ThesisRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private static final DateTimeFormatter SLOT_TIME_FORMAT = DateTimeFormatter.ofPattern("MMM d, yyyy 'at' HH:mm");

    private final BookingRepository bookingRepository;
    private final ReviewSlotRepository reviewSlotRepository;
    private final ThesisRepository thesisRepository;
    private final ThesisService thesisService;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository,
                           ReviewSlotRepository reviewSlotRepository,
                           ThesisRepository thesisRepository,
                           ThesisService thesisService,
                           NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.reviewSlotRepository = reviewSlotRepository;
        this.thesisRepository = thesisRepository;
        this.thesisService = thesisService;
        this.notificationService = notificationService;
    }

    @Transactional
    public BookingResponse createBooking(UUID studentId, UUID slotId) {
        Thesis thesis = thesisRepository.findByStudentId(studentId)
                .orElseThrow(() -> ApiException.notFound("You must register a thesis before booking a slot"));

        if (bookingRepository.findByThesisIdAndStatus(thesis.getId(), BookingStatus.BOOKED).isPresent()) {
            throw ApiException.conflict("You already have an active booking; cancel it before booking another slot");
        }

        ReviewSlot slot = reviewSlotRepository.findById(slotId)
                .orElseThrow(() -> ApiException.notFound("Review slot not found"));

        LocalDateTime slotDateTime = LocalDateTime.of(slot.getSlotDate(), slot.getStartTime());
        if (slotDateTime.isBefore(LocalDateTime.now())) {
            throw ApiException.badRequest("Cannot book a slot that is in the past");
        }

        if (slot.getBookedCount() >= slot.getCapacity()) {
            throw ApiException.conflict("This slot is full");
        }

        slot.setBookedCount(slot.getBookedCount() + 1);
        reviewSlotRepository.save(slot);

        Booking booking = Booking.builder()
                .thesis(thesis)
                .slot(slot)
                .build();
        booking = bookingRepository.saveAndFlush(booking);

        thesisService.advanceStatusIfForward(thesis, ThesisStatus.PROTOTYPE_PENDING);

        notificationService.notify(
                thesis.getStudent(),
                "Booking confirmed",
                "Your prototype review slot on " + slotDateTime.format(SLOT_TIME_FORMAT) + " is confirmed.",
                NotificationType.BOOKING_CONFIRMED
        );

        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse completeBooking(UUID bookingId, String reviewerNotes) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));

        if (booking.getStatus() != BookingStatus.BOOKED) {
            throw ApiException.conflict("Only booked sessions can be marked completed");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCompletedAt(LocalDateTime.now());
        booking.setReviewerNotes(reviewerNotes);
        booking = bookingRepository.save(booking);

        thesisService.markPrototypeReviewed(booking.getThesis());

        notificationService.notify(
                booking.getThesis().getStudent(),
                "Prototype review completed",
                "Your prototype review has been marked as completed.",
                NotificationType.REVIEW_COMPLETED
        );

        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(UUID bookingId, UUID actorId, boolean privileged) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));

        if (booking.getStatus() != BookingStatus.BOOKED) {
            throw ApiException.conflict("Only booked sessions can be cancelled");
        }

        if (!privileged && !booking.getThesis().getStudent().getId().equals(actorId)) {
            throw ApiException.forbidden("You can only cancel your own booking");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking = bookingRepository.save(booking);

        ReviewSlot slot = booking.getSlot();
        slot.setBookedCount(Math.max(slot.getBookedCount() - 1, 0));
        reviewSlotRepository.save(slot);

        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(UUID studentId) {
        Thesis thesis = thesisRepository.findByStudentId(studentId)
                .orElseThrow(() -> ApiException.notFound("You have not registered a thesis yet"));

        return bookingRepository.findByThesisIdOrderByBookedAtDesc(thesis.getId())
                .stream()
                .map(BookingResponse::from)
                .toList();
    }
}
