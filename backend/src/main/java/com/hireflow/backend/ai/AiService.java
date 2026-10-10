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
        return call(prompts.safety() + " Answer only from the authenticated student's reference data below. " +
                "If the answer is not in the data, say you cannot determine it. Do not claim unsupported facts.",
                "Student question:\n" + bounded(message) + "\nAuthenticated student's data:\n" + bounded(ownedContext),
                String.class);
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
            throw new IllegalStateException("The AI service could not complete this request.", exception);
        }
    }

    private static String bounded(String text) {
        if (text == null || text.isBlank())
            return "Not provided.";
        return text.length() <= MAX_CONTEXT_CHARS ? text : text.substring(0, MAX_CONTEXT_CHARS);
    }
}