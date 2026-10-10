package com.hireflow.backend.document;

import com.hireflow.backend.application.InternshipApplicationService;
import com.hireflow.backend.common.CurrentUserService;
import com.hireflow.backend.common.OwnershipGuard;
import com.hireflow.backend.exception.ResourceNotFoundException;
import com.hireflow.backend.user.UserService;
import java.nio.file.Path;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentService {
    private final ResumeRepository resumes;
    private final ApplicationDocumentRepository documents;
    private final FileStorageService storage;
    private final CurrentUserService currentUser;
    private final UserService users;
    private final InternshipApplicationService applications;

    public DocumentService(ResumeRepository resumes, ApplicationDocumentRepository documents,
            FileStorageService storage,
            CurrentUserService currentUser, UserService users, InternshipApplicationService applications) {
        this.resumes = resumes;
        this.documents = documents;
        this.storage = storage;
        this.currentUser = currentUser;
        this.users = users;
        this.applications = applications;
    }

    @Transactional
    public ResumeResponse uploadResume(MultipartFile file) {
        Long userId = currentUser.getUserId();
        FileStorageService.StoredFile stored = storage.store(file, "resumes/" + userId);
        try {
            Resume resume = new Resume(users.findById(userId), stored.originalFilename(), stored.storedFilename(),
                    stored.relativePath(), stored.contentType(), stored.sizeBytes());
            if (resumes.findFirstByUser_IdAndDefaultResumeTrue(userId).isEmpty())
                resume.setDefaultResume(true);
            return ResumeResponse.from(resumes.save(resume));
        } catch (RuntimeException exception) {
            storage.delete(stored.relativePath());
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<ResumeResponse> listResumes() {
        return resumes.findByUser_IdOrderByUploadedAtDesc(currentUser.getUserId()).stream().map(ResumeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public DownloadFile resumeContent(Long id) {
        Resume resume = OwnershipGuard.require(resumes.findByIdAndUser_Id(id, currentUser.getUserId()),
                resumes.existsById(id), "resume");
        return new DownloadFile(storage.resolve(resume.getRelativePath()), resume.getOriginalFilename(),
                resume.getContentType());
    }

    @Transactional
    public void setDefault(Long id) {
        Long userId = currentUser.getUserId();
        Resume resume = OwnershipGuard.require(resumes.findByIdAndUser_Id(id, userId), resumes.existsById(id),
                "resume");
        resumes.clearDefaultForUser(userId);
        resume.setDefaultResume(true);
        resumes.save(resume);
    }

    @Transactional
    public void deleteResume(Long id) {
        Resume resume = OwnershipGuard.require(resumes.findByIdAndUser_Id(id, currentUser.getUserId()),
                resumes.existsById(id), "resume");
        resumes.delete(resume);
        storage.delete(resume.getRelativePath());
    }

    @Transactional
    public FileResponse uploadApplicationDocument(Long applicationId, MultipartFile file) {
        var application = applications.findOwned(applicationId);
        FileStorageService.StoredFile stored = storage.store(file);
        try {
            ApplicationDocument document = new ApplicationDocument(users.findById(currentUser.getUserId()), application,
                    stored.originalFilename(), stored.storedFilename(), stored.contentType(), stored.sizeBytes());
            return FileResponse.from(documents.save(document));
        } catch (RuntimeException exception) {
            storage.delete(stored.storedFilename());
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<FileResponse> listApplicationDocuments(Long applicationId) {
        applications.findOwned(applicationId);
        return documents.findByApplication_IdAndUser_IdOrderByUploadedAtDesc(applicationId, currentUser.getUserId())
                .stream().map(FileResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public DownloadFile download(Long id) {
        ApplicationDocument document = OwnershipGuard.require(documents.findByIdAndUser_Id(id, currentUser.getUserId()),
                documents.existsById(id), "document");
        return new DownloadFile(storage.resolve(document.getStoredFilename()), document.getOriginalFilename(),
                document.getContentType());
    }

    @Transactional
    public void deleteApplicationDocument(Long id) {
        ApplicationDocument document = OwnershipGuard.require(documents.findByIdAndUser_Id(id, currentUser.getUserId()),
                documents.existsById(id), "document");
        documents.delete(document);
        storage.delete(document.getStoredFilename());
    }

    public Resume defaultResume() {
        return resumes.findFirstByUser_IdAndDefaultResumeTrue(currentUser.getUserId())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Set a default resume before using resume comparison."));
    }

    public String resumeText(Resume resume) {
        return storage.extractText(resume.getRelativePath());
    }

    @Transactional(readOnly = true)
    public String chatContext() {
        Long userId = currentUser.getUserId();
        StringBuilder context = new StringBuilder();
        resumes.findFirstByUser_IdAndDefaultResumeTrue(userId).ifPresent(resume -> {
            context.append("Default resume ").append(resume.getOriginalFilename()).append(":\n")
                    .append(storage.extractText(resume.getRelativePath())).append('\n');
        });
        documents.findTop5ByUser_IdOrderByUploadedAtDesc(userId).forEach(document -> {
            context.append("Application document ").append(document.getOriginalFilename()).append(":\n")
                    .append(storage.extractText(document.getStoredFilename())).append('\n');
        });
        return context.toString();
    }

    public record DownloadFile(Path path, String originalFilename, String contentType) {
    }
}