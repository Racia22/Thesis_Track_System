package com.auca.thesistrack.controller;

import com.auca.thesistrack.dto.thesis.AssignSupervisorRequest;
import com.auca.thesistrack.dto.thesis.CreateThesisRequest;
import com.auca.thesistrack.dto.thesis.ThesisResponse;
import com.auca.thesistrack.security.UserPrincipal;
import com.auca.thesistrack.service.ThesisService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/theses")
public class ThesisController {

    private final ThesisService thesisService;

    public ThesisController(ThesisService thesisService) {
        this.thesisService = thesisService;
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ThesisResponse> getMyThesis(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(thesisService.getMyThesis(principal.getId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ThesisResponse> registerThesis(@AuthenticationPrincipal UserPrincipal principal,
                                                          @Valid @RequestBody CreateThesisRequest request) {
        ThesisResponse response = thesisService.registerThesis(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/supervised")
    @PreAuthorize("hasRole('SUPERVISOR')")
    public ResponseEntity<List<ThesisResponse>> getSupervisedTheses(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(thesisService.getSupervisedTheses(principal.getId()));
    }

    @GetMapping("/queue/supervisor")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'ADMIN')")
    public ResponseEntity<List<ThesisResponse>> getSupervisorAssignmentQueue() {
        return ResponseEntity.ok(thesisService.getSupervisorAssignmentQueue());
    }

    @PostMapping("/{id}/assign-supervisor")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'ADMIN')")
    public ResponseEntity<ThesisResponse> assignSupervisor(@PathVariable UUID id,
                                                            @Valid @RequestBody AssignSupervisorRequest request) {
        return ResponseEntity.ok(thesisService.assignSupervisor(id, request.supervisorId()));
    }
}
