package com.auca.thesistrack.dto.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EmailNormalizerTest {

    @Test
    void loginEmailIsTrimmedAndLowercased() {
        LoginRequest request = new LoginRequest("  Student1@AUCA.ac.rw ", "Student@1234");

        assertThat(request.email()).isEqualTo("student1@auca.ac.rw");
    }

    @Test
    void registrationEmailIsStoredInTheSameForm() {
        RegisterRequest request = new RegisterRequest("Aline", " Aline@Auca.AC.RW", "password1", "STUDENT", null, null);

        assertThat(request.email()).isEqualTo("aline@auca.ac.rw");
    }

    @Test
    void nullStaysNullSoValidationReportsIt() {
        assertThat(new LoginRequest(null, "x").email()).isNull();
    }
}
