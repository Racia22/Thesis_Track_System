package com.auca.thesistrack.dto.supervisor;

import com.auca.thesistrack.entity.User;

import java.util.UUID;

public record SupervisorSummaryResponse(
        UUID id,
        String name,
        String email,
        String department,
        long currentStudentCount
) {
    public static SupervisorSummaryResponse of(User supervisor, long currentStudentCount) {
        return new SupervisorSummaryResponse(
                supervisor.getId(),
                supervisor.getName(),
                supervisor.getEmail(),
                supervisor.getDepartment(),
                currentStudentCount
        );
    }
}
