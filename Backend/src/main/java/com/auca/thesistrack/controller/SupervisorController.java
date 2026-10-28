package com.auca.thesistrack.controller;

import com.auca.thesistrack.dto.supervisor.SupervisorSummaryResponse;
import com.auca.thesistrack.service.ThesisService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/supervisors")
public class SupervisorController {

    private final ThesisService thesisService;

    public SupervisorController(ThesisService thesisService) {
        this.thesisService = thesisService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COORDINATOR', 'ADMIN')")
    public ResponseEntity<List<SupervisorSummaryResponse>> getSupervisors() {
        return ResponseEntity.ok(thesisService.getSupervisorsWithWorkload());
    }
}
