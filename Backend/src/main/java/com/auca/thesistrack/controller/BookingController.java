package com.auca.thesistrack.controller;

import com.auca.thesistrack.dto.booking.BookingResponse;
import com.auca.thesistrack.dto.booking.CompleteBookingRequest;
import com.auca.thesistrack.dto.booking.CreateBookingRequest;
import com.auca.thesistrack.security.UserPrincipal;
import com.auca.thesistrack.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<BookingResponse> createBooking(@AuthenticationPrincipal UserPrincipal principal,
                                                          @Valid @RequestBody CreateBookingRequest request) {
        BookingResponse response = bookingService.createBooking(principal.getId(), request.slotId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'SUPERVISOR', 'ADMIN')")
    public ResponseEntity<BookingResponse> completeBooking(@PathVariable UUID id,
                                                            @RequestBody(required = false) CompleteBookingRequest request) {
        String notes = request != null ? request.reviewerNotes() : null;
        return ResponseEntity.ok(bookingService.completeBooking(id, notes));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('STUDENT', 'COORDINATOR', 'ADMIN')")
    public ResponseEntity<BookingResponse> cancelBooking(@AuthenticationPrincipal UserPrincipal principal,
                                                          @PathVariable UUID id) {
        boolean privileged = principal.getUser().getRole().name().equals("COORDINATOR")
                || principal.getUser().getRole().name().equals("ADMIN");
        return ResponseEntity.ok(bookingService.cancelBooking(id, principal.getId(), privileged));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(bookingService.getMyBookings(principal.getId()));
    }
}
