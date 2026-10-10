package com.hireflow.backend.document;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Tag(name = "Documents and resumes")
@SecurityRequirement(name = "bearerAuth")
public class DocumentController {
    private final DocumentService service;

    public DocumentController(DocumentService service) {
        this.service = service;
    }

    @PostMapping(value = "/api/resumes/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload a private PDF or DOCX resume")
    public ResumeResponse uploadResume(@RequestPart("file") MultipartFile file) {
        return service.uploadResume(file);
    }

    @GetMapping("/api/resumes")
    @Operation(summary = "List the authenticated user's resumes")
    public List<ResumeResponse> resumes() {
        return service.listResumes();
    }

    @GetMapping("/api/resumes/{id}/content")
    @Operation(summary = "Preview or download an owned resume")
    public ResponseEntity<Resource> resumeContent(@PathVariable Long id) {
        DocumentService.DownloadFile file = service.resumeContent(id);
        ContentDisposition disposition = file.contentType().equals(MediaType.APPLICATION_PDF_VALUE)
                ? ContentDisposition.inline().filename(file.originalFilename(), StandardCharsets.UTF_8).build()
                : ContentDisposition.attachment().filename(file.originalFilename(), StandardCharsets.UTF_8).build();
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(new FileSystemResource(file.path()));
    }

    @PutMapping("/api/resumes/{id}/default")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Set an owned resume as the default")
    public void setDefault(@PathVariable Long id) {
        service.setDefault(id);
    }

    @DeleteMapping("/api/resumes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete an owned resume and its stored file")
    public void deleteResume(@PathVariable Long id) {
        service.deleteResume(id);
    }

    @PostMapping(value = "/api/applications/{applicationId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public FileResponse uploadDocument(@PathVariable Long applicationId, @RequestPart("file") MultipartFile file) {
        return service.uploadApplicationDocument(applicationId, file);
    }

    @GetMapping("/api/applications/{applicationId}/documents")
    public List<FileResponse> documents(@PathVariable Long applicationId) {
        return service.listApplicationDocuments(applicationId);
    }

    @GetMapping("/api/documents/{id}/download")
    @Operation(summary = "Download an owned application document")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        DocumentService.DownloadFile file = service.download(id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(file.originalFilename(), StandardCharsets.UTF_8).build().toString())
                .body(new FileSystemResource(file.path()));
    }

    @DeleteMapping("/api/documents/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDocument(@PathVariable Long id) {
        service.deleteApplicationDocument(id);
    }
}