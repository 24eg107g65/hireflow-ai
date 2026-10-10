package com.hireflow.backend.exception;

public class AiUnavailableException extends RuntimeException {
    public AiUnavailableException() {
        super("AI service is not configured.");
    }
}