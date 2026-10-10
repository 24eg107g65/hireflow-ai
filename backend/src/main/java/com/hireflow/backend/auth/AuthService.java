package com.hireflow.backend.auth;

import com.hireflow.backend.exception.ResourceNotFoundException;
import com.hireflow.backend.user.User;
import com.hireflow.backend.user.UserProfileResponse;
import com.hireflow.backend.user.UserRepository;
import com.hireflow.backend.user.UserService;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserService userService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final long expirationMinutes;
    private final long refreshDays;

    public AuthService(UserService userService, UserRepository userRepository,
            AuthenticationManager authenticationManager,
            JwtEncoder jwtEncoder, JwtDecoder jwtDecoder,
            @Value("${app.jwt.expiration-minutes:60}") long expirationMinutes,
            @Value("${app.jwt.refresh-days:30}") long refreshDays) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.expirationMinutes = expirationMinutes;
        this.refreshDays = refreshDays;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        try {
            return tokens(userService.register(request));
        } catch (DataIntegrityViolationException exception) {
            throw new DataIntegrityViolationException("Email is already registered.");
        }
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.email().trim().toLowerCase(), request.password()));
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));
        return tokens(user);
    }

    public AuthResponse refresh(String refreshToken) {
        try {
            Jwt decoded = jwtDecoder.decode(refreshToken);
            if (!"refresh".equals(decoded.getClaimAsString("token_use")))
                throw new BadCredentialsException("Invalid refresh token.");
            User user = userRepository.findById(Long.valueOf(decoded.getSubject()))
                    .orElseThrow(() -> new BadCredentialsException("Invalid refresh token."));
            return tokens(user);
        } catch (RuntimeException exception) {
            throw new BadCredentialsException("Invalid refresh token.");
        }
    }

    private AuthResponse tokens(User user) {
        Instant now = Instant.now();
        String access = token(user, now, now.plus(expirationMinutes, ChronoUnit.MINUTES), "access");
        String refresh = token(user, now, now.plus(refreshDays, ChronoUnit.DAYS), "refresh");
        return new AuthResponse(access, refresh, "Bearer", expirationMinutes * 60, UserProfileResponse.from(user));
    }

    private String token(User user, Instant issuedAt, Instant expiresAt, String tokenUse) {
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("hireflow-api").issuedAt(issuedAt).expiresAt(expiresAt)
                .subject(user.getId().toString()).id(UUID.randomUUID().toString()).claim("email", user.getEmail())
                .claim("role", user.getRole().name()).claim("token_use", tokenUse).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}