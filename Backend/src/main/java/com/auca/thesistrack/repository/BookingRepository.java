package com.auca.thesistrack.repository;

import com.auca.thesistrack.entity.Booking;
import com.auca.thesistrack.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByThesisId(UUID thesisId);

    List<Booking> findByThesisIdOrderByBookedAtDesc(UUID thesisId);

    Optional<Booking> findByThesisIdAndStatus(UUID thesisId, BookingStatus status);

    boolean existsBySlotId(UUID slotId);
}
