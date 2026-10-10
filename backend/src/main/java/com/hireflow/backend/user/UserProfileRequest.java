package com.hireflow.backend.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UserProfileRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(max = 2000) String careerGoal,
        @Size(max = 30) List<@Size(max = 100) String> preferredRoles,
        @Size(max = 100) List<@Size(max = 100) String> skills,
        Boolean notificationPreference) {
}