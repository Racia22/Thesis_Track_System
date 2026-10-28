package com.auca.thesistrack.security;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-that-is-comfortably-over-32-bytes";

    private final JwtService jwtService = new JwtService(SECRET, 60_000, 120_000);

    @Test
    void accessTokenRoundTripsClaims() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId, "a@auca.ac.rw", "STUDENT");

        assertThat(jwtService.isTokenValid(token)).isTrue();
        assertThat(jwtService.isAccessToken(token)).isTrue();
        assertThat(jwtService.isRefreshToken(token)).isFalse();
        assertThat(jwtService.extractEmail(token)).isEqualTo("a@auca.ac.rw");
        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
        assertThat(jwtService.extractRole(token)).isEqualTo("STUDENT");
    }

    @Test
    void refreshTokenIsNotAnAccessToken() {
        String token = jwtService.generateRefreshToken(UUID.randomUUID(), "a@auca.ac.rw", "STUDENT");

        assertThat(jwtService.isRefreshToken(token)).isTrue();
        assertThat(jwtService.isAccessToken(token)).isFalse();
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        JwtService other = new JwtService("a-completely-different-secret-also-over-32-bytes", 60_000, 120_000);
        String forged = other.generateAccessToken(UUID.randomUUID(), "x@auca.ac.rw", "ADMIN");

        assertThat(jwtService.isTokenValid(forged)).isFalse();
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService shortLived = new JwtService(SECRET, -1_000, -1_000);
        String expired = shortLived.generateAccessToken(UUID.randomUUID(), "a@auca.ac.rw", "STUDENT");

        assertThat(jwtService.isTokenValid(expired)).isFalse();
    }
}
