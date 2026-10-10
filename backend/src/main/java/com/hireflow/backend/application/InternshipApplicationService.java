package com.hireflow.backend.application;

import com.hireflow.backend.common.CurrentUserService;
import com.hireflow.backend.common.OwnershipGuard;
import com.hireflow.backend.common.PageResponse;
import com.hireflow.backend.user.UserService;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InternshipApplicationService {
    private static final Set<String> SORT_FIELDS = Set.of("deadline", "companyName", "jobRole", "createdAt",
            "updatedAt", "status");
    private final InternshipApplicationRepository repository;
    private final CurrentUserService currentUserService;
    private final UserService userService;

    public InternshipApplicationService(InternshipApplicationRepository repository,
            CurrentUserService currentUserService, UserService userService) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.userService = userService;
    }

    @Transactional
    public ApplicationResponse create(ApplicationRequest request) {
        InternshipApplication entity = new InternshipApplication(userService.findById(currentUserService.getUserId()),
                request.companyName().trim(), request.jobRole().trim(), request.status());
        apply(entity, request);
        return ApplicationResponse.from(repository.save(entity));
    }

    @Transactional(readOnly = true)
    public PageResponse<ApplicationResponse> list(int page, int size, String search, ApplicationStatus status,
            String sortBy, String direction) {
        String field = SORT_FIELDS.contains(sortBy) ? sortBy : "deadline";
        Sort.Direction order = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.clamp(size, 1, 100), Sort.by(order, field));
        Page<ApplicationResponse> result = repository.findAll(
                ApplicationSpecifications.forUser(currentUserService.getUserId(), search, status), pageable)
                .map(ApplicationResponse::from);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public ApplicationResponse get(Long id) {
        return ApplicationResponse.from(findOwned(id));
    }

    @Transactional
    public ApplicationResponse update(Long id, ApplicationRequest request) {
        InternshipApplication entity = findOwned(id);
        apply(entity, request);
        return ApplicationResponse.from(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findOwned(id));
    }

    @Transactional(readOnly = true)
    public InternshipApplication findOwned(Long id) {
        return OwnershipGuard.require(repository.findByIdAndUserId(id, currentUserService.getUserId()),
                repository.existsById(id), "application");
    }

    private void apply(InternshipApplication entity, ApplicationRequest request) {
        entity.setCompanyName(request.companyName().trim());
        entity.setJobRole(request.jobRole().trim());
        entity.setApplicationLink(request.applicationLink());
        entity.setDeadline(request.deadline());
        entity.setStatus(request.status());
        entity.setJobDescription(request.jobDescription());
        entity.setNotes(request.notes());
    }
}