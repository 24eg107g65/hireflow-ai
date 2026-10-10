package com.hireflow.backend.ai;

import java.util.List;

public record InterviewQuestionResponse(List<InterviewQuestion> questions) {
    public record InterviewQuestion(String category, String question, List<String> preparationPoints) {
    }
}