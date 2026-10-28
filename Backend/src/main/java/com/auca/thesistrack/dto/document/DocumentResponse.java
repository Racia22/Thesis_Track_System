package com.auca.thesistrack.dto.document;

import com.auca.thesistrack.entity.ThesisDocument;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentResponse(
        UUID id,
        UUID thesisId,
        UUID uploadedById,
        String uploadedByName,
        String fileName,
        String fileType,
        int fileSizeKb,
        int version,
        LocalDateTime uploadedAt
) {
    public static DocumentResponse from(ThesisDocument document) {
        return new DocumentResponse(
                document.getId(),
                document.getThesis().getId(),
                document.getUploadedBy().getId(),
                document.getUploadedBy().getName(),
                document.getFileName(),
                document.getFileType(),
                document.getFileSizeKb() != null ? document.getFileSizeKb() : 0,
                document.getVersion() != null ? document.getVersion() : 1,
                document.getUploadedAt()
        );
    }
}
