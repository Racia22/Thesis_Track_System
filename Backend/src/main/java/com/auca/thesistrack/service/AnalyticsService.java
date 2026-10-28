package com.auca.thesistrack.service;

import com.auca.thesistrack.dto.analytics.StageDistributionEntry;
import com.auca.thesistrack.dto.analytics.StageWaitTimeEntry;
import com.auca.thesistrack.dto.supervisor.SupervisorSummaryResponse;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.ThesisStageHistory;
import com.auca.thesistrack.entity.enums.ThesisStatus;
import com.auca.thesistrack.repository.ThesisRepository;
import com.auca.thesistrack.repository.ThesisStageHistoryRepository;
import com.auca.thesistrack.util.ThesisStageUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ThesisRepository thesisRepository;
    private final ThesisService thesisService;
    private final ThesisStageHistoryRepository stageHistoryRepository;

    public AnalyticsService(ThesisRepository thesisRepository, ThesisService thesisService,
                             ThesisStageHistoryRepository stageHistoryRepository) {
        this.thesisRepository = thesisRepository;
        this.thesisService = thesisService;
        this.stageHistoryRepository = stageHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<StageDistributionEntry> getStageDistribution() {
        Map<ThesisStatus, Long> counts = thesisRepository.findAll().stream()
                .collect(Collectors.groupingBy(Thesis::getStatus, Collectors.counting()));

        return Arrays.stream(ThesisStatus.values())
                .map(status -> new StageDistributionEntry(status.name(), counts.getOrDefault(status, 0L)))
                .toList();
    }

    /**
     * Per stage, two views of wait time: how long the theses sitting there right now have
     * been waiting (the bottleneck signal), and how long a thesis historically spent there
     * before moving on, from closed rows in thesis_stage_history.
     */
    @Transactional(readOnly = true)
    public List<StageWaitTimeEntry> getWaitTimes() {
        Map<ThesisStatus, List<Thesis>> byStatus = thesisRepository.findAll().stream()
                .collect(Collectors.groupingBy(Thesis::getStatus));

        Map<ThesisStatus, List<Double>> completedVisitDays = stageHistoryRepository.findAll().stream()
                .filter(h -> h.getExitedAt() != null)
                .collect(Collectors.groupingBy(ThesisStageHistory::getStatus,
                        Collectors.mapping(AnalyticsService::visitDays, Collectors.toList())));

        return Arrays.stream(ThesisStatus.values())
                .map(status -> {
                    List<Thesis> group = byStatus.getOrDefault(status, List.of());
                    double averageDays = group.stream()
                            .mapToLong(ThesisStageUtil::daysInCurrentStage)
                            .average()
                            .orElse(0.0);
                    List<Double> visits = completedVisitDays.getOrDefault(status, List.of());
                    double historicalAverage = visits.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                    return new StageWaitTimeEntry(status.name(), roundOneDecimal(averageDays), group.size(),
                            roundOneDecimal(historicalAverage), visits.size());
                })
                .toList();
    }

    private static double visitDays(ThesisStageHistory visit) {
        long hours = Duration.between(visit.getEnteredAt(), visit.getExitedAt()).toHours();
        return Math.max(hours, 0) / 24.0;
    }

    private static double roundOneDecimal(double value) {
        return Math.round(value * 10) / 10.0;
    }

    @Transactional(readOnly = true)
    public List<SupervisorSummaryResponse> getSupervisorWorkload() {
        return thesisService.getSupervisorsWithWorkload();
    }
}
