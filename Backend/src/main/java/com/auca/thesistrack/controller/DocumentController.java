package com.auca.thesistrack.controller;

import com.auca.thesistrack.dto.document.DocumentDownload;
import com.auca.thesistrack.dto.document.DocumentResponse;
import com.auca.thesistrack.security.UserPrincipal;
import com.auca.thesistrack.service.DocumentService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping("/{thesisId}")
    public ResponseEntity<List<DocumentResponse>> listDocuments(@AuthenticationPrincipal UserPrincipal principal,
                                                                 @PathVariable UUID thesisId) {
        return ResponseEntity.ok(documentService.listDocuments(thesisId, principal.getId()));
    }

    @PostMapping(value = "/{thesisId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> uploadDocument(@AuthenticationPrincipal UserPrincipal principal,
                                                            @PathVariable UUID thesisId,
                                                            @RequestParam("file") MultipartFile file) {
        DocumentResponse response = documentService.uploadDocument(thesisId, principal.getId(), file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{thesisId}/{documentId}/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadDocument(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID thesisId,
            @PathVariable UUID documentId) {
        DocumentDownload download = documentService.prepareDownload(thesisId, documentId, principal.getId());

        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(download.fileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(download.contentType() != null
                        ? MediaType.parseMediaType(download.contentType())
                        : MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(download.sizeBytes())
                .body(download.resource());
    }
}
