package com.auca.thesistrack.repository;

import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.enums.ThesisStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ThesisRepository extends JpaRepository<Thesis, UUID> {

    Optional<Thesis> findByStudentId(UUID studentId);

    List<Thesis> findByStatus(ThesisStatus status);

    List<Thesis> findByStatusOrderByRegisteredAtAsc(ThesisStatus status);

    List<Thesis> findByStatusOrderByPrototypeReviewedAtAsc(ThesisStatus status);

    List<Thesis> findBySupervisorId(UUID supervisorId);

    long countBySupervisorIdAndStatusNot(UUID supervisorId, ThesisStatus status);
}
