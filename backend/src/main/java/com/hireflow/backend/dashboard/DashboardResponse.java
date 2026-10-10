package com.hireflow.backend.dashboard;

import com.hireflow.backend.application.ApplicationResponse;
import com.hireflow.backend.task.TaskResponse;
import java.util.List;
import java.util.Map;

public record DashboardResponse(long totalApplications, Map<String, Long> applicationsByStatus,
        List<ApplicationResponse> upcomingDeadlines,
        List<TaskResponse> overdueTasks, List<TaskResponse> upcomingTasks,
        List<ApplicationResponse> recentApplications,
        long interviewCount, long offerCount) {
}