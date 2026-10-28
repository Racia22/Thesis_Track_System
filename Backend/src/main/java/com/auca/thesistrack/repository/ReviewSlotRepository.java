package com.auca.thesistrack.repository;

import com.auca.thesistrack.entity.ReviewSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ReviewSlotRepository extends JpaRepository<ReviewSlot, UUID> {

    List<ReviewSlot> findBySlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate date);
}
