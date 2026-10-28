package com.auca.thesistrack.service;

import com.auca.thesistrack.dto.analytics.StageDistributionEntry;
import com.auca.thesistrack.dto.analytics.StageWaitTimeEntry;
import com.auca.thesistrack.dto.supervisor.SupervisorSummaryResponse;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.enums.ThesisStatus;
import com.auca.thesistrack.repository.ThesisRepository;
import com.auca.thesistrack.util.ThesisStageUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ThesisRepository thesisRepository;
    private final ThesisService thesisService;

    public AnalyticsService(ThesisRepository thesisRepository, ThesisService thesisService) {
        this.thesisRepository = thesisRepository;
        this.thesisService = thesisService;
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
     * Average days theses currently sitting in each stage have been waiting there.
     * The schema has no stage-transition history table, so this reflects current
     * wait time snapshots rather than a full historical average — it's the metric
     * that actually matters for bottleneck detection (which stage has the longest
     * backlog right now), which is the stated purpose of this endpoint.
     */
    @Transactional(readOnly = true)
    public List<StageWaitTimeEntry> getWaitTimes() {
        Map<ThesisStatus, List<Thesis>> byStatus = thesisRepository.findAll().stream()
                .collect(Collectors.groupingBy(Thesis::getStatus));

        return Arrays.stream(ThesisStatus.values())
                .map(status -> {
                    List<Thesis> group = byStatus.getOrDefault(status, List.of());
                    double averageDays = group.stream()
                            .mapToLong(ThesisStageUtil::daysInCurrentStage)
                            .average()
                            .orElse(0.0);
                    return new StageWaitTimeEntry(status.name(), Math.round(averageDays * 10) / 10.0, group.size());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SupervisorSummaryResponse> getSupervisorWorkload() {
        return thesisService.getSupervisorsWithWorkload();
    }
}
