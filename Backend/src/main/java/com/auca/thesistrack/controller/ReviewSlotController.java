package com.auca.thesistrack.controller;

import com.auca.thesistrack.dto.slot.CreateSlotRequest;
import com.auca.thesistrack.dto.slot.SlotResponse;
import com.auca.thesistrack.security.UserPrincipal;
import com.auca.thesistrack.service.ReviewSlotService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/slots")
public class ReviewSlotController {

    private final ReviewSlotService reviewSlotService;

    public ReviewSlotController(ReviewSlotService reviewSlotService) {
        this.reviewSlotService = reviewSlotService;
    }

    @GetMapping
    public ResponseEntity<List<SlotResponse>> getAvailableSlots() {
        return ResponseEntity.ok(reviewSlotService.getAvailableSlots());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COORDINATOR', 'ADMIN')")
    public ResponseEntity<SlotResponse> createSlot(@AuthenticationPrincipal UserPrincipal principal,
                                                    @Valid @RequestBody CreateSlotRequest request) {
        SlotResponse response = reviewSlotService.createSlot(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'ADMIN')")
    public ResponseEntity<Void> cancelSlot(@PathVariable UUID id) {
        reviewSlotService.cancelSlot(id);
        return ResponseEntity.noContent().build();
    }
}
