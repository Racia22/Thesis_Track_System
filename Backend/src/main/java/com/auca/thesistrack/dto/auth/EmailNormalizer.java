package com.auca.thesistrack.dto.auth;

import java.util.Locale;

/** Emails are stored lowercase and trimmed; incoming ones are normalised the same way before lookup. */
public final class EmailNormalizer {

    private EmailNormalizer() {
    }

    public static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
