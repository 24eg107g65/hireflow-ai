package com.hireflow.backend.user;

import java.util.Arrays;
import java.util.List;

public record UserProfileResponse(Long id, String fullName, String email, String role,
        String careerGoal, List<String> preferredRoles,
        List<String> skills, boolean notificationPreference) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(user.getId(), user.getFullName(), user.getEmail(),
                user.getRole().name(), user.getCareerGoal(), split(user.getPreferredRoles()),
                split(user.getSkills()), user.isNotificationEnabled());
    }

    private static List<String> split(String value) {
        if (value == null || value.isBlank())
            return List.of();
        return Arrays.stream(value.split("\\n")).map(String::trim).filter(item -> !item.isEmpty()).toList();
    }
}