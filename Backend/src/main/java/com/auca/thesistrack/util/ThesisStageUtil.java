package com.auca.thesistrack.util;

import com.auca.thesistrack.entity.Thesis;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * The schema has no stage-transition history table, so "time in stage" is derived from
 * whichever timestamp column corresponds to the thesis's current status, falling back to
 * updated_at. This means it reflects time in the CURRENT stage only, not a full historical
 * per-stage duration log.
 */
public final class ThesisStageUtil {

    private ThesisStageUtil() {
    }

    public static LocalDateTime resolveStageEnteredAt(Thesis thesis) {
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
        LocalDateTime stageEnteredAt = resolveStageEnteredAt(thesis);
        if (stageEnteredAt == null) {
            return 0;
        }
        return Math.max(ChronoUnit.DAYS.between(stageEnteredAt, LocalDateTime.now()), 0);
    }
}
