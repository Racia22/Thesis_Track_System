package com.auca.thesistrack.repository;

import com.auca.thesistrack.entity.ThesisStageHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ThesisStageHistoryRepository extends JpaRepository<ThesisStageHistory, UUID> {

    Optional<ThesisStageHistory> findByThesisIdAndExitedAtIsNull(UUID thesisId);

    List<ThesisStageHistory> findByThesisIdOrderByEnteredAtAsc(UUID thesisId);
}
