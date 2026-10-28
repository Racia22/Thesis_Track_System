package com.auca.thesistrack.util;

import com.auca.thesistrack.entity.Thesis;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Time-in-current-stage helpers. {@code stage_entered_at} is maintained on every status
 * change (and back-filled for older rows by StageHistoryBackfill); the timestamp-column
 * fallback only covers a row that somehow has none, e.g. one inserted by hand.
 * Per-stage durations across a thesis's whole history live in thesis_stage_history.
 */
public final class ThesisStageUtil {

    private ThesisStageUtil() {
    }

    public static LocalDateTime resolveStageEnteredAt(Thesis thesis) {
        if (thesis.getStageEnteredAt() != null) {
            return thesis.getStageEnteredAt();
        }
        return switch (thesis.getStatus()) {
            case REGISTERED -> thesis.getRegisteredAt();
            case PROTOTYPE_REVIEWED -> thesis.getPrototypeReviewedAt() != null
                    ? thesis.getPrototypeReviewedAt() : thesis.getUpdatedAt();
            case SUPERVISOR_ASSIGNED -> thesis.getSupervisorAssignedAt() != null
                    ? thesis.getSupervisorAssignedAt() : thesis.getUpdatedAt();
            default -> thesis.getUpdatedAt() != null ? thesis.getUpdatedAt() : thesis.getRegisteredAt();
        };
    }

    public static long daysInCurrentStage(Thesis thesis) {
        return daysBetween(resolveStageEnteredAt(thesis), LocalDateTime.now());
    }

    public static long daysBetween(LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null) {
            return 0;
        }
        return Math.max(ChronoUnit.DAYS.between(from, to), 0);
    }
}
