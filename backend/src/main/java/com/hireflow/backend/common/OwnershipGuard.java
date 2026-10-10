package com.hireflow.backend.common;

import com.hireflow.backend.exception.ForbiddenOperationException;
import com.hireflow.backend.exception.ResourceNotFoundException;
import java.util.Optional;

public final class OwnershipGuard {
    private OwnershipGuard() {
    }

    public static <T> T require(Optional<T> owned, boolean exists, String resource) {
        if (owned.isPresent())
            return owned.get();
        if (exists)
            throw new ForbiddenOperationException("You are not permitted to access this " + resource + ".");
        throw new ResourceNotFoundException(
                resource.substring(0, 1).toUpperCase() + resource.substring(1) + " not found.");
    }
}