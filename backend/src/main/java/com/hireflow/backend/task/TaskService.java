package com.hireflow.backend.task;

import com.hireflow.backend.application.InternshipApplication;
import com.hireflow.backend.application.InternshipApplicationService;
import com.hireflow.backend.common.CurrentUserService;
import com.hireflow.backend.common.OwnershipGuard;
import com.hireflow.backend.user.UserService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {
    private final TaskRepository repository;
    private final CurrentUserService currentUser;
    private final UserService users;
    private final InternshipApplicationService applications;

    public TaskService(TaskRepository repository, CurrentUserService currentUser,
            UserService users, InternshipApplicationService applications) {
        this.repository = repository;
        this.currentUser = currentUser;
        this.users = users;
        this.applications = applications;
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Task task = new Task(users.findById(currentUser.getUserId()), application(request.applicationId()),
                request.title().trim(), request.dueDate(),
                request.priority() == null ? TaskPriority.NORMAL : request.priority());
        if (request.completed() != null)
            task.setCompleted(request.completed());
        return TaskResponse.from(repository.save(task));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list() {
        return repository.findByUserIdOrderByDueDateAscCreatedAtDesc(currentUser.getUserId()).stream()
                .map(TaskResponse::from).toList();
    }

    @Transactional
    public TaskResponse update(Long id, TaskRequest request) {
        Task task = findOwned(id);
        task.setTitle(request.title().trim());
        task.setDueDate(request.dueDate());
        task.setApplication(application(request.applicationId()));
        if (request.completed() != null)
            task.setCompleted(request.completed());
        if (request.priority() != null)
            task.setPriority(request.priority());
        return TaskResponse.from(repository.save(task));
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findOwned(id));
    }

    @Transactional(readOnly = true)
    public List<Task> upcoming(LocalDate from) {
        return repository.findTop10ByUserIdAndDueDateGreaterThanEqualAndCompletedFalseOrderByDueDateAsc(
                currentUser.getUserId(), from);
    }

    @Transactional(readOnly = true)
    public List<Task> overdue(LocalDate before) {
        return repository.findTop10ByUserIdAndDueDateLessThanAndCompletedFalseOrderByDueDateAsc(currentUser.getUserId(),
                before);
    }

    @Transactional(readOnly = true)
    public List<Task> pending() {
        return repository.findByUserIdAndCompletedFalseOrderByDueDateAsc(currentUser.getUserId());
    }

    @Transactional(readOnly = true)
    public List<Task> pendingForChat() {
        return repository.findTop20ByUserIdAndCompletedFalseOrderByDueDateAsc(currentUser.getUserId());
    }

    private Task findOwned(Long id) {
        return OwnershipGuard.require(repository.findByIdAndUserId(id, currentUser.getUserId()),
                repository.existsById(id), "task");
    }

    private InternshipApplication application(Long applicationId) {
        return applicationId == null ? null : applications.findOwned(applicationId);
    }
}