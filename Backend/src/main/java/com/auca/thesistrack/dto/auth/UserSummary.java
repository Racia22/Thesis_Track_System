package com.auca.thesistrack.dto.auth;

import com.auca.thesistrack.entity.User;

import java.util.UUID;

public record UserSummary(
        UUID id,
        String name,
        String email,
        String role,
        String phone,
        String department
) {
    public static UserSummary from(User user) {
        return new UserSummary(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhone(),
                user.getDepartment()
        );
    }
}
