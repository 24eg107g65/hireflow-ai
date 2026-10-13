package com.hireflow.backend.ai;

public record DiagnosticPingResponse(String status, int httpStatus, String message) {
}
