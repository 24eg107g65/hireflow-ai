package com.hireflow.backend.application;

import org.springframework.data.jpa.domain.Specification;

public final class ApplicationSpecifications {
    private ApplicationSpecifications() {
    }

    public static Specification<InternshipApplication> forUser(Long userId, String search, ApplicationStatus status) {
        return (root, query, builder) -> {
            var predicates = builder.equal(root.get("user").get("id"), userId);
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates = builder.and(predicates, builder.or(
                        builder.like(builder.lower(root.get("companyName")), pattern),
                        builder.like(builder.lower(root.get("jobRole")), pattern)));
            }
            if (status != null)
                predicates = builder.and(predicates, builder.equal(root.get("status"), status));
            return predicates;
        };
    }
}