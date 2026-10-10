package com.hireflow.backend.note;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Application notes")
@SecurityRequirement(name = "bearerAuth")
public class NoteController {
    private final NoteService service;

    public NoteController(NoteService service) {
        this.service = service;
    }

    @PostMapping("/api/applications/{applicationId}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a note to an owned application")
    public NoteResponse create(@PathVariable Long applicationId, @Valid @RequestBody NoteRequest request) {
        return service.create(applicationId, request);
    }

    @GetMapping("/api/applications/{applicationId}/notes")
    @Operation(summary = "List notes for an owned application")
    public List<NoteResponse> list(@PathVariable Long applicationId) {
        return service.list(applicationId);
    }

    @PutMapping("/api/notes/{id}")
    @Operation(summary = "Update an owned note")
    public NoteResponse update(@PathVariable Long id, @Valid @RequestBody NoteRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/api/notes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete an owned note")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}