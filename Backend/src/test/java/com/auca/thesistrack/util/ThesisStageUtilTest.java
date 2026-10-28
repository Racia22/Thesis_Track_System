package com.auca.thesistrack.util;

import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.enums.Role;
import com.auca.thesistrack.entity.enums.ThesisStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static com.auca.thesistrack.TestData.thesis;
import static com.auca.thesistrack.TestData.user;
import static org.assertj.core.api.Assertions.assertThat;

class ThesisStageUtilTest {

    @Test
    void prefersRecordedStageEntry() {
        Thesis thesis = thesis(user(Role.STUDENT, "A"), ThesisStatus.IN_PROGRESS);
        thesis.setUpdatedAt(LocalDateTime.now().minusDays(1));
        thesis.setStageEnteredAt(LocalDateTime.now().minusDays(9));

        assertThat(ThesisStageUtil.daysInCurrentStage(thesis)).isEqualTo(9);
    }

    @Test
    void fallsBackToStageTimestampWhenNoEntryRecorded() {
        Thesis thesis = thesis(user(Role.STUDENT, "A"), ThesisStatus.SUPERVISOR_ASSIGNED);
        thesis.setSupervisorAssignedAt(LocalDateTime.now().minusDays(5));
        thesis.setUpdatedAt(LocalDateTime.now());

        assertThat(ThesisStageUtil.daysInCurrentStage(thesis)).isEqualTo(5);
    }

    @Test
    void neverNegativeAndToleratesMissingDates() {
        Thesis thesis = thesis(user(Role.STUDENT, "A"), ThesisStatus.REGISTERED);
        assertThat(ThesisStageUtil.daysInCurrentStage(thesis)).isZero();

        thesis.setStageEnteredAt(LocalDateTime.now().plusDays(2));
        assertThat(ThesisStageUtil.daysInCurrentStage(thesis)).isZero();
    }
}
