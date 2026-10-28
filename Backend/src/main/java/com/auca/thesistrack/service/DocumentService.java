package com.auca.thesistrack.service;

import com.auca.thesistrack.dto.document.DocumentDownload;
import com.auca.thesistrack.dto.document.DocumentResponse;
import com.auca.thesistrack.entity.Thesis;
import com.auca.thesistrack.entity.ThesisDocument;
import com.auca.thesistrack.exception.ApiException;
import com.auca.thesistrack.repository.ThesisDocumentRepository;
import com.auca.thesistrack.repository.ThesisRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "png", "jpg", "jpeg", "txt"
    );

    private final ThesisDocumentRepository thesisDocumentRepository;
    private final ThesisRepository thesisRepository;
    private final Path uploadRoot;

    public DocumentService(ThesisDocumentRepository thesisDocumentRepository,
                            ThesisRepository thesisRepository,
                            @Value("${app.upload.dir}") String uploadDir) {
        this.thesisDocumentRepository = thesisDocumentRepository;
        this.thesisRepository = thesisRepository;
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadRoot);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not create upload directory: " + uploadRoot, e);
        }
    }

    @Transactional
    public DocumentResponse uploadDocument(UUID thesisId, UUID uploaderId, MultipartFile file) {
        Thesis thesis = thesisRepository.findById(thesisId)
                .orElseThrow(() -> ApiException.notFound("Thesis not found"));

        if (!thesis.getStudent().getId().equals(uploaderId)) {
            throw ApiException.forbidden("Only the thesis owner can upload documents");
        }

        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("The uploaded file is empty");
        }

        String originalName = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "document"));
        String extension = extractExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw ApiException.badRequest("Unsupported file type: ." + extension);
        }

        int nextVersion = thesisDocumentRepository.findTopByThesisIdAndFileNameOrderByVersionDesc(thesisId, originalName)
                .map(existing -> existing.getVersion() + 1)
                .orElse(1);

        String storedFileName = UUID.randomUUID() + "." + extension;
        Path thesisDir = uploadRoot.resolve(thesisId.toString()).normalize();
        Path targetPath = thesisDir.resolve(storedFileName).normalize();

        if (!targetPath.startsWith(uploadRoot)) {
            throw ApiException.badRequest("Invalid file name");
        }

        try {
            Files.createDirectories(thesisDir);
            file.transferTo(targetPath);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store uploaded file", e);
        }

        ThesisDocument document = ThesisDocument.builder()
                .thesis(thesis)
                .uploadedBy(thesis.getStudent())
                .fileName(originalName)
                .filePath(targetPath.toString())
                .fileType(file.getContentType())
                .fileSizeKb((int) Math.ceil(file.getSize() / 1024.0))
                .version(nextVersion)
                .build();

        document = thesisDocumentRepository.saveAndFlush(document);
        return DocumentResponse.from(document);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listDocuments(UUID thesisId, UUID requesterId) {
        Thesis thesis = thesisRepository.findById(thesisId)
                .orElseThrow(() -> ApiException.notFound("Thesis not found"));
        assertAccess(thesis, requesterId);

        return thesisDocumentRepository.findByThesisIdOrderByUploadedAtDesc(thesisId)
                .stream()
                .map(DocumentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentDownload prepareDownload(UUID thesisId, UUID documentId, UUID requesterId) {
        Thesis thesis = thesisRepository.findById(thesisId)
                .orElseThrow(() -> ApiException.notFound("Thesis not found"));
        assertAccess(thesis, requesterId);

        ThesisDocument document = thesisDocumentRepository.findById(documentId)
                .filter(d -> d.getThesis().getId().equals(thesisId))
                .orElseThrow(() -> ApiException.notFound("Document not found"));

        Path filePath = Path.of(document.getFilePath());
        if (!Files.exists(filePath)) {
            throw ApiException.notFound("This file is no longer available on the server");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            return new DocumentDownload(resource, document.getFileName(), document.getFileType(), Files.size(filePath));
        } catch (MalformedURLException e) {
            throw new UncheckedIOException(e);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read stored file", e);
        }
    }

    private void assertAccess(Thesis thesis, UUID userId) {
        boolean isStudent = thesis.getStudent().getId().equals(userId);
        boolean isSupervisor = thesis.getSupervisor() != null && thesis.getSupervisor().getId().equals(userId);
        if (!isStudent && !isSupervisor) {
            throw ApiException.forbidden("You do not have access to these documents");
        }
    }

    private String extractExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot < 0 || lastDot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(lastDot + 1).toLowerCase();
    }
}
