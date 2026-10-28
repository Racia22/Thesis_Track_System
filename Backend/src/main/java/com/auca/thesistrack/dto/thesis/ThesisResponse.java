package com.auca.thesistrack.dto.thesis;

import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.util.ThesisStageUtil;

import java.time.LocalDateTime;
import java.util.UUID;

public record ThesisResponse(
        UUID id,
        String title,
        String description,
        String status,
        LocalDateTime registeredAt,
        LocalDateTime prototypeReviewedAt,
        LocalDateTime supervisorAssignedAt,
        LocalDateTime defenseDate,
        LocalDateTime updatedAt,
        LocalDateTime stageEnteredAt,
        long daysInCurrentStage,
        UUID studentId,
        String studentName,
        String studentEmail,
        UUID supervisorId,
        String supervisorName,
        String supervisorEmail
) {
    public static ThesisResponse from(Thesis thesis) {
        LocalDateTime stageEnteredAt = ThesisStageUtil.resolveStageEnteredAt(thesis);

        return new ThesisResponse(
                thesis.getId(),
                thesis.getTitle(),
                thesis.getDescription(),
                thesis.getStatus().name(),
                thesis.getRegisteredAt(),
                thesis.getPrototypeReviewedAt(),
                thesis.getSupervisorAssignedAt(),
                thesis.getDefenseDate(),
                thesis.getUpdatedAt(),
                stageEnteredAt,
                ThesisStageUtil.daysInCurrentStage(thesis),
                thesis.getStudent().getId(),
                thesis.getStudent().getName(),
                thesis.getStudent().getEmail(),
                thesis.getSupervisor() != null ? thesis.getSupervisor().getId() : null,
                thesis.getSupervisor() != null ? thesis.getSupervisor().getName() : null,
                thesis.getSupervisor() != null ? thesis.getSupervisor().getEmail() : null
        );
    }
}
