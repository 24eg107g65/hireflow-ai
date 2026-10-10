package com.hireflow.backend.note;

import com.hireflow.backend.application.InternshipApplicationService;
import com.hireflow.backend.common.CurrentUserService;
import com.hireflow.backend.common.OwnershipGuard;
import com.hireflow.backend.user.UserService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoteService {
    private final NoteRepository repository;
    private final InternshipApplicationService applications;
    private final CurrentUserService currentUser;
    private final UserService users;

    public NoteService(NoteRepository repository, InternshipApplicationService applications,
            CurrentUserService currentUser, UserService users) {
        this.repository = repository;
        this.applications = applications;
        this.currentUser = currentUser;
        this.users = users;
    }

    @Transactional
    public NoteResponse create(Long applicationId, NoteRequest request) {
        var application = applications.findOwned(applicationId);
        return NoteResponse.from(repository
                .save(new Note(users.findById(currentUser.getUserId()), application, request.content().trim())));
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> list(Long applicationId) {
        applications.findOwned(applicationId);
        return repository.findByApplication_IdAndUser_IdOrderByCreatedAtDesc(applicationId, currentUser.getUserId())
                .stream().map(NoteResponse::from).toList();
    }

    @Transactional
    public NoteResponse update(Long id, NoteRequest request) {
        Note note = findOwned(id);
        note.setContent(request.content().trim());
        return NoteResponse.from(repository.save(note));
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findOwned(id));
    }

    private Note findOwned(Long id) {
        return OwnershipGuard.require(repository.findByIdAndUserId(id, currentUser.getUserId()),
                repository.existsById(id), "note");
    }
}