package com.auca.thesistrack.service;

import com.auca.thesistrack.dto.analytics.StageWaitTimeEntry;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.ThesisStageHistory;
import com.auca.thesistrack.entity.enums.Role;
import com.auca.thesistrack.entity.enums.ThesisStatus;
import com.auca.thesistrack.repository.ThesisRepository;
import com.auca.thesistrack.repository.ThesisStageHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static com.auca.thesistrack.TestData.thesis;
import static com.auca.thesistrack.TestData.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private ThesisRepository thesisRepository;
    @Mock
    private ThesisService thesisService;
    @Mock
    private ThesisStageHistoryRepository stageHistoryRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private static ThesisStageHistory visit(ThesisStatus status, LocalDateTime entered, LocalDateTime exited) {
        return ThesisStageHistory.builder().status(status).enteredAt(entered).exitedAt(exited).build();
    }

    @Test
    void waitTimesCombineCurrentSnapshotWithClosedHistory() {
        LocalDateTime now = LocalDateTime.now();
        Thesis current = thesis(user(Role.STUDENT, "A"), ThesisStatus.REGISTERED);
        current.setStageEnteredAt(now.minusDays(4));
        when(thesisRepository.findAll()).thenReturn(List.of(current));
        when(stageHistoryRepository.findAll()).thenReturn(List.of(
                visit(ThesisStatus.REGISTERED, now.minusDays(30), now.minusDays(20)), // 10 days
                visit(ThesisStatus.REGISTERED, now.minusDays(12), now.minusDays(10)), // 2 days
                visit(ThesisStatus.REGISTERED, now.minusDays(4), null)                 // still open: excluded
        ));

        StageWaitTimeEntry registered = analyticsService.getWaitTimes().stream()
                .filter(e -> e.status().equals("REGISTERED"))
                .findFirst().orElseThrow();

        assertThat(registered.thesisCount()).isEqualTo(1);
        assertThat(registered.averageDays()).isEqualTo(4.0);
        assertThat(registered.historicalSampleSize()).isEqualTo(2);
        assertThat(registered.historicalAverageDays()).isEqualTo(6.0);
    }

    @Test
    void everyStageIsReportedEvenWhenEmpty() {
        when(thesisRepository.findAll()).thenReturn(List.of());
        when(stageHistoryRepository.findAll()).thenReturn(List.of());

        List<StageWaitTimeEntry> entries = analyticsService.getWaitTimes();

        assertThat(entries).hasSize(ThesisStatus.values().length)
                .allSatisfy(e -> {
                    assertThat(e.thesisCount()).isZero();
                    assertThat(e.historicalSampleSize()).isZero();
                });
    }
}
