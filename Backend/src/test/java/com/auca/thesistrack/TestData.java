package com.auca.thesistrack;

import com.auca.thesistrack.entity.ReviewSlot;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.User;
import com.auca.thesistrack.entity.enums.Role;
import com.auca.thesistrack.entity.enums.ThesisStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/** Small builders for entities used across unit tests. */
public final class TestData {

    private TestData() {
    }

    public static User user(Role role, String name) {
        return User.builder()
                .id(UUID.randomUUID())
                .name(name)
                .email(name.toLowerCase().replace(" ", ".") + "@auca.ac.rw")
                .passwordHash("hash")
                .role(role)
                .build();
    }

    public static Thesis thesis(User student, ThesisStatus status) {
        return Thesis.builder()
                .id(UUID.randomUUID())
                .student(student)
                .title("Thesis of " + student.getName())
                .status(status)
                .build();
    }

    public static ReviewSlot slot(LocalDate date, int capacity, int bookedCount) {
        return ReviewSlot.builder()
                .id(UUID.randomUUID())
                .slotDate(date)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .capacity(capacity)
                .bookedCount(bookedCount)
                .build();
    }
}
