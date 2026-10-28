package com.auca.thesistrack.dto.auth;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        UserSummary user
) {
    public static AuthResponse of(String accessToken, String refreshToken, UserSummary user) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", user);
    }
}
