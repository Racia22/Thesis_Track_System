package com.auca.thesistrack.repository;

import com.auca.thesistrack.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    List<Feedback> findByThesisIdOrderByCreatedAtDesc(UUID thesisId);
}
