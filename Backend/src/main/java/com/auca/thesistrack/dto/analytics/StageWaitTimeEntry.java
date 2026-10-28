package com.auca.thesistrack.dto.analytics;

public record StageWaitTimeEntry(
        String status,
        double averageDays,
        long thesisCount
) {
}
