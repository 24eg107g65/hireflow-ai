package com.hireflow.backend.ai;

import java.util.List;

public record JobAnalysisResponse(String summary, List<String> requiredSkills, List<String> preferredSkills,
        List<String> responsibilities, List<String> eligibilityNotes,
        List<String> deadlineNotes, String warningMessage) {
}