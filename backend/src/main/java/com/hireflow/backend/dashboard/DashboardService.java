package com.hireflow.backend.dashboard;

import com.hireflow.backend.application.ApplicationResponse;
import com.hireflow.backend.application.ApplicationStatus;
import com.hireflow.backend.application.InternshipApplicationRepository;
import com.hireflow.backend.common.CurrentUserService;
import com.hireflow.backend.document.DocumentService;
import com.hireflow.backend.task.TaskResponse;
import com.hireflow.backend.task.TaskService;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {
    private final InternshipApplicationRepository applications;
    private final TaskService tasks;
    private final CurrentUserService currentUser;

    public DashboardService(InternshipApplicationRepository applications, TaskService tasks,
            CurrentUserService currentUser, DocumentService documents) {
        this.applications = applications;
        this.tasks = tasks;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public DashboardResponse get() {
        Long userId = currentUser.getUserId();
        Map<String, Long> statuses = Arrays.stream(ApplicationStatus.values()).collect(Collectors.toMap(
                Enum::name, status -> applications.countByUserIdAndStatus(userId, status)));
        var upcoming = applications.findTop10ByUserIdAndDeadlineGreaterThanEqualAndStatusNotInOrderByDeadlineAsc(
                userId, LocalDate.now(), java.util.List.of(ApplicationStatus.OFFER, ApplicationStatus.REJECTED))
                .stream().map(ApplicationResponse::from).toList();
        return new DashboardResponse(applications.countByUserId(userId), statuses, upcoming,
                tasks.overdue(LocalDate.now()).stream().map(TaskResponse::from).toList(),
                tasks.upcoming(LocalDate.now()).stream().map(TaskResponse::from).toList(),
                applications.findTop5ByUserIdOrderByUpdatedAtDesc(userId).stream().map(ApplicationResponse::from)
                        .toList(),
                applications.countByUserIdAndStatus(userId, ApplicationStatus.INTERVIEW),
                applications.countByUserIdAndStatus(userId, ApplicationStatus.OFFER));
    }
}