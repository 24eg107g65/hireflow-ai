package com.hireflow.backend.auth;

import com.hireflow.backend.user.UserProfileResponse;

public record AuthResponse(String accessToken, String refreshToken, String tokenType,
        long expiresIn, UserProfileResponse user) {
}