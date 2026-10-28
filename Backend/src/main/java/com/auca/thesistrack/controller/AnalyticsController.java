package com.auca.thesistrack.controller;

import com.auca.thesistrack.dto.analytics.StageDistributionEntry;
import com.auca.thesistrack.dto.analytics.StageWaitTimeEntry;
import com.auca.thesistrack.dto.supervisor.SupervisorSummaryResponse;
import com.auca.thesistrack.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/wait-times")
    public ResponseEntity<List<StageWaitTimeEntry>> getWaitTimes() {
        return ResponseEntity.ok(analyticsService.getWaitTimes());
    }

    @GetMapping("/stage-distribution")
    public ResponseEntity<List<StageDistributionEntry>> getStageDistribution() {
        return ResponseEntity.ok(analyticsService.getStageDistribution());
    }

    @GetMapping("/supervisor-workload")
    public ResponseEntity<List<SupervisorSummaryResponse>> getSupervisorWorkload() {
        return ResponseEntity.ok(analyticsService.getSupervisorWorkload());
    }
}
