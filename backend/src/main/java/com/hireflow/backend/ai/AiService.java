package com.hireflow.backend.ai;

import com.hireflow.backend.application.InternshipApplicationService;
import com.hireflow.backend.document.DocumentService;
import com.hireflow.backend.document.Resume;
import com.hireflow.backend.exception.AiUnavailableException;
import java.util.List;
import java.util.function.Supplier;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiService {
    private static final int MAX_CONTEXT_CHARS = 20000;
    private final ObjectProvider<ChatClient> clients;
    private final AiPromptService prompts;
    private final InternshipApplicationService applications;
    private final DocumentService documents;
    private final boolean enabled;

    public AiService(ObjectProvider<ChatClient> clients, AiPromptService prompts,
            InternshipApplicationService applications, DocumentService documents,
            @Value("${app.ai.enabled:false}") boolean enabled) {
        this.clients = clients;
        this.prompts = prompts;
        this.applications = applications;
        this.documents = documents;
        this.enabled = enabled;
    }

    public JobAnalysisResponse analyzeJob(Long applicationId) {
        var application = applications.findOwned(applicationId);
        String job = bounded(application.getJobDescription());
        return call(prompts.analyzeJob(),
                "Analyze this job description. Return warningMessage if missing details.\n" + job,
                JobAnalysisResponse.class);
    }

    public ResumeMatchResponse compareResume(Long applicationId) {
        var application = applications.findOwned(applicationId);
        Resume resume = documents.defaultResume();
        String resumeText = bounded(documents.resumeText(resume));
        String job = bounded(application.getJobDescription());
        return call(prompts.compareResume(), "Resume (reference only):\n" + resumeText + "\nJob description:\n" + job,
                ResumeMatchResponse.class);
    }

    public InterviewQuestionResponse interviewQuestions(Long applicationId) {
        var application = applications.findOwned(applicationId);
        return call(prompts.interviewQuestions(),
                "Role: " + application.getJobRole() + " at " + application.getCompanyName() +
                        "\nJob description:\n" + bounded(application.getJobDescription()),
                InterviewQuestionResponse.class);
    }

    public FollowUpEmailResponse followUpEmail(Long applicationId) {
        var application = applications.findOwned(applicationId);
        return call(prompts.followUpEmail(),
                "Role: " + application.getJobRole() + " at " + application.getCompanyName() +
                        "\nApplication notes:\n" + bounded(application.getNotes()),
                FollowUpEmailResponse.class);
    }

    public String chat(String message, String ownedContext) {
        requireEnabled();
        try {
            return clients.getObject().prompt()
                    .system(prompts.safety() + " Answer only from the authenticated student's reference data below. " +
                            "If the answer is not in the data, say you cannot determine it. Do not claim unsupported facts.")
                    .user("Student question:\n" + bounded(message) + "\nAuthenticated student's data:\n" + bounded(ownedContext))
                    .call()
                    .content();
        } catch (AiUnavailableException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("The AI service could not complete this request: " + sanitizeError(exception), exception);
        }
    }

    public DiagnosticPingResponse ping() {
        requireEnabled();
        try {
            String result = clients.getObject().prompt()
                    .user("Reply with exactly: GEMINI_OK")
                    .call()
                    .content();
            return new DiagnosticPingResponse("OK", 200, result != null ? result.trim() : "GEMINI_OK");
        } catch (AiUnavailableException exception) {
            throw exception;
        } catch (Exception exception) {
            String sanitized = sanitizeError(exception);
            return new DiagnosticPingResponse("ERROR", extractStatusCode(exception), sanitized);
        }
    }

    public void requireEnabled() {
        if (!enabled || clients.getIfAvailable() == null)
            throw new AiUnavailableException();
    }

    private <T> T call(String system, String user, Class<T> responseType) {
        requireEnabled();
        try {
            return clients.getObject().prompt().system(system).user(user).call().entity(responseType);
        } catch (AiUnavailableException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("The AI service could not complete this request: " + sanitizeError(exception), exception);
        }
    }

    private String sanitizeError(Throwable throwable) {
        if (throwable == null) return "Unknown AI provider error.";
        StringBuilder details = new StringBuilder();
        Throwable current = throwable;
        while (current != null) {
            String msg = current.getMessage();
            if (msg != null && !msg.isBlank()) {
                if (details.length() > 0) details.append(": ");
                details.append(msg);
            }
            current = current.getCause();
        }
        String message = details.toString();
        if (message.isBlank()) {
            return throwable.getClass().getSimpleName();
        }
        message = message.replaceAll("(?i)(key|token|secret)=[^&\\s]+", "$1=REDACTED");
        message = message.replaceAll("AIza[0-9A-Za-z-_]{35}", "REDACTED_API_KEY");
        if (message.contains("denied access") || message.contains("PERMISSION_DENIED")) {
            return "Google Gemini API rejected access: Your project has been denied access (HTTP 403). A new API key from an active Google AI Studio project is required.";
        }
        if (message.contains("Quota exceeded") || message.contains("RESOURCE_EXHAUSTED")) {
            return "Google Gemini API quota exceeded (HTTP 429): Quota limit reached for the configured model. Please check billing or quota in Google AI Studio.";
        }
        if (message.contains("is no longer available") || message.contains("not found for API version")) {
            return "Google Gemini model error (HTTP 404): The configured model is not available for this API key. Update GEMINI_MODEL in configuration.";
        }
        return message.length() > 400 ? message.substring(0, 400) + "..." : message;
    }

    private int extractStatusCode(Throwable throwable) {
        String msg = throwable.getMessage();
        if (msg != null) {
            if (msg.contains("403") || msg.contains("PERMISSION_DENIED")) return 403;
            if (msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED")) return 429;
            if (msg.contains("404") || msg.contains("NOT_FOUND")) return 404;
        }
        return 502;
    }

    private static String bounded(String text) {
        if (text == null || text.isBlank())
            return "Not provided.";
        return text.length() <= MAX_CONTEXT_CHARS ? text : text.substring(0, MAX_CONTEXT_CHARS);
    }
}