package com.auca.thesistrack.repository;

import com.auca.thesistrack.entity.ThesisDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ThesisDocumentRepository extends JpaRepository<ThesisDocument, UUID> {

    List<ThesisDocument> findByThesisIdOrderByUploadedAtDesc(UUID thesisId);

    Optional<ThesisDocument> findTopByThesisIdAndFileNameOrderByVersionDesc(UUID thesisId, String fileName);
}
