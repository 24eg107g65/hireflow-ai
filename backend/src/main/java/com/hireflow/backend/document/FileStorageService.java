package com.hireflow.backend.document;

import com.hireflow.backend.exception.ResourceNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FileStorageService {
    public static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final String PDF = "application/pdf";
    private static final String DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    private final Path root;
    private final Tika tika = new Tika();

    public FileStorageService(@Value("${app.upload-dir:./uploads}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public StoredFile store(MultipartFile file) {
        return store(file, "");
    }

    public StoredFile store(MultipartFile file, String directory) {
        validate(file);
        String original = StringUtils
                .cleanPath(file.getOriginalFilename() == null ? "document" : file.getOriginalFilename());
        if (original.contains("..") || original.contains("/") || original.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Invalid file name.");
        }
        String extension = original.toLowerCase(Locale.ROOT).endsWith(".pdf") ? ".pdf" : ".docx";
        String detected = detect(file);
        String contentType = extension.equals(".pdf") ? PDF : DOCX;
        if (!extension.equals(detected.equals(PDF) ? ".pdf" : detected.equals(DOCX) ? ".docx" : "")) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Only valid PDF and DOCX files are supported.");
        }
        String stored = UUID.randomUUID() + extension;
        String relativePath = directory.isBlank() ? stored : directory + "/" + stored;
        try {
            Path destination = resolvePath(relativePath);
            Files.createDirectories(destination.getParent());
            if (!destination.startsWith(root))
                throw new IOException("Invalid storage path.");
            file.transferTo(destination);
            return new StoredFile(original, stored, relativePath, contentType, file.getSize());
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to store uploaded file.", exception);
        }
    }

    public Path resolve(String relativePath) {
        Path path = resolvePath(relativePath);
        if (!Files.isRegularFile(path))
            throw new ResourceNotFoundException("File not found.");
        return path;
    }

    private Path resolvePath(String relativePath) {
        Path relative = Paths.get(relativePath).normalize();
        if (relative.isAbsolute() || relative.startsWith(".."))
            throw new ResourceNotFoundException("File not found.");
        Path path = root.resolve(relative).normalize();
        if (!path.startsWith(root))
            throw new ResourceNotFoundException("File not found.");
        return path;
    }

    public void delete(String storedFilename) {
        try {
            Files.deleteIfExists(resolve(storedFilename));
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to delete stored file.", exception);
        }
    }

    public String extractText(String storedFilename) {
        try {
            return tika.parseToString(resolve(storedFilename));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to read document content.", exception);
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a file to upload.");
        if (file.getSize() > MAX_FILE_SIZE)
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Uploaded file exceeds the 10 MB limit.");
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Only PDF and DOCX files are supported.");
        }
    }

    private String detect(MultipartFile file) {
        try {
            return tika.detect(file.getInputStream(), file.getOriginalFilename());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not inspect uploaded file.");
        }
    }

    public record StoredFile(String originalFilename, String storedFilename, String relativePath, String contentType,
            long sizeBytes) {
    }
}