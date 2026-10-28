package com.auca.thesistrack.dto.analytics;

/**
 * @param averageDays           average days the theses currently in this stage have been there
 * @param thesisCount           theses currently in this stage
 * @param historicalAverageDays average days a thesis spent in this stage before moving on,
 *                              across every completed visit recorded in stage history
 * @param historicalSampleSize  number of completed visits behind {@code historicalAverageDays}
 */
public record StageWaitTimeEntry(
        String status,
        double averageDays,
        long thesisCount,
        double historicalAverageDays,
        long historicalSampleSize
) {
}
