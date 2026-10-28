package com.auca.thesistrack.service;

import com.auca.thesistrack.dto.auth.AuthResponse;
import com.auca.thesistrack.dto.auth.LoginRequest;
import com.auca.thesistrack.dto.auth.RegisterRequest;
import com.auca.thesistrack.dto.auth.UserSummary;
import com.auca.thesistrack.entity.User;
import com.auca.thesistrack.entity.enums.Role;
import com.auca.thesistrack.exception.ApiException;
import com.auca.thesistrack.repository.UserRepository;
import com.auca.thesistrack.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
public class AuthService {

    private static final Set<Role> SELF_REGISTERABLE_ROLES = Set.of(Role.STUDENT, Role.SUPERVISOR);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        JwtService jwtService,
                        AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Role role;
        try {
            role = Role.valueOf(request.role());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid role: " + request.role());
        }

        if (!SELF_REGISTERABLE_ROLES.contains(role)) {
            throw ApiException.forbidden("Self-registration is only available for STUDENT and SUPERVISOR roles");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw ApiException.conflict("An account with this email already exists");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .phone(request.phone())
                .department(request.department())
                .isActive(true)
                .build();

        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw ApiException.unauthorized("Invalid or expired refresh token");
        }

        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.unauthorized("Invalid or expired refresh token"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw ApiException.forbidden("Account is disabled");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name());
        return AuthResponse.of(accessToken, refreshToken, UserSummary.from(user));
    }
}
