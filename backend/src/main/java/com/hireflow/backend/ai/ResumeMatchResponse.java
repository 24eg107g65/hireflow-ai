package com.hireflow.backend.ai;

import java.util.List;

public record ResumeMatchResponse(List<String> matchedSkills, List<String> missingSkills,
        List<String> suggestedTruthfulKeywords, List<String> recommendations) {
}