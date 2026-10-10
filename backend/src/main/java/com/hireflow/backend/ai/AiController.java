package com.hireflow.backend.ai;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@Tag(name = "AI preparation")
@SecurityRequirement(name = "bearerAuth")
public class AiController {
    private final AiService ai;
    private final AiChatService chat;

    public AiController(AiService ai, AiChatService chat) {
        this.ai = ai;
        this.chat = chat;
    }

    @PostMapping("/applications/{applicationId}/analyze-job")
    @Operation(summary = "Analyze an owned job description")
    public JobAnalysisResponse analyze(@PathVariable Long applicationId) {
        return ai.analyzeJob(applicationId);
    }

    @PostMapping("/applications/{applicationId}/compare-resume")
    @Operation(summary = "Compare the default resume with an owned role")
    public ResumeMatchResponse compare(@PathVariable Long applicationId) {
        return ai.compareResume(applicationId);
    }

    @PostMapping("/applications/{applicationId}/generate-interview-questions")
    public InterviewQuestionResponse questions(@PathVariable Long applicationId) {
        return ai.interviewQuestions(applicationId);
    }

    @PostMapping("/applications/{applicationId}/draft-follow-up-email")
    public FollowUpEmailResponse email(@PathVariable Long applicationId) {
        return ai.followUpEmail(applicationId);
    }

    @PostMapping("/chat/conversations")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create an AI chat conversation")
    public ChatConversationResponse create(@RequestBody(required = false) ChatConversationRequest request) {
        return chat.create(request);
    }

    @GetMapping("/chat/conversations")
    public List<ChatConversationResponse> conversations() {
        return chat.list();
    }

    @GetMapping("/chat/conversations/{id}/messages")
    public List<ChatMessageResponse> messages(@PathVariable Long id) {
        return chat.messages(id);
    }

    @PostMapping("/chat/conversations/{id}/messages")
    public ChatExchangeResponse send(@PathVariable Long id, @Valid @RequestBody ChatMessageRequest request) {
        return chat.send(id, request);
    }
}