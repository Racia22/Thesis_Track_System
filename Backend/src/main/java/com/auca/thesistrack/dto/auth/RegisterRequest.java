package com.auca.thesistrack.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        String password,

        @NotBlank(message = "Role is required")
        @Pattern(regexp = "STUDENT|SUPERVISOR|COORDINATOR|ADMIN", message = "Role must be one of STUDENT, SUPERVISOR, COORDINATOR, ADMIN")
        String role,

        String phone,

        String department
) {
    public RegisterRequest {
        email = EmailNormalizer.normalize(email);
    }
}
