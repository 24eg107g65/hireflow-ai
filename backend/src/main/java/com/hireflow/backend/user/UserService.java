package com.hireflow.backend.user;

import com.hireflow.backend.auth.RegisterRequest;
import com.hireflow.backend.common.CurrentUserService;
import com.hireflow.backend.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUserService = currentUserService;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password."));
        return org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password(user.getPasswordHash()).authorities("ROLE_" + user.getRole().name()).build();
    }

    @Transactional
    public User register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) throw new DataIntegrityViolationException("Email is already registered.");
        return userRepository.save(new User(request.fullName().trim(), email, passwordEncoder.encode(request.password())));
    }

    @Transactional(readOnly = true)
    public User getCurrentUser() { return findById(currentUserService.getUserId()); }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    @Transactional
    public UserProfileResponse updateProfile(UserProfileRequest request) {
        User user = getCurrentUser();
        String email = normalizeEmail(request.email());
        userRepository.findByEmailIgnoreCase(email).filter(existing -> !existing.getId().equals(user.getId()))
                .ifPresent(existing -> { throw new DataIntegrityViolationException("Email is already registered."); });
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setCareerGoal(blankToNull(request.careerGoal()));
        user.setPreferredRoles(join(request.preferredRoles()));
        user.setSkills(join(request.skills()));
        if (request.notificationPreference() != null) user.setNotificationEnabled(request.notificationPreference());
        return UserProfileResponse.from(userRepository.save(user));
    }

    private static String normalizeEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static String join(List<String> values) {
        return values == null ? null : values.stream().map(String::trim).filter(value -> !value.isEmpty())
                .distinct().reduce((first, next) -> first + "\n" + next).orElse(null);
    }
}