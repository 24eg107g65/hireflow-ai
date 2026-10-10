package com.hireflow.backend.ai;

import com.hireflow.backend.application.ApplicationResponse;
import com.hireflow.backend.application.ApplicationSpecifications;
import com.hireflow.backend.application.InternshipApplicationRepository;
import com.hireflow.backend.common.CurrentUserService;
import com.hireflow.backend.common.OwnershipGuard;
import com.hireflow.backend.task.TaskResponse;
import com.hireflow.backend.task.TaskService;
import com.hireflow.backend.user.UserProfileResponse;
import com.hireflow.backend.user.UserService;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiChatService {
    private final ChatConversationRepository conversations;
    private final ChatMessageRepository messages;
    private final CurrentUserService currentUser;
    private final UserService users;
    private final InternshipApplicationRepository applications;
    private final TaskService tasks;
    private final com.hireflow.backend.document.DocumentService documents;
    private final AiService ai;

    public AiChatService(ChatConversationRepository conversations, ChatMessageRepository messages,
            CurrentUserService currentUser, UserService users,
            InternshipApplicationRepository applications, TaskService tasks,
            com.hireflow.backend.document.DocumentService documents, AiService ai) {
        this.conversations = conversations;
        this.messages = messages;
        this.currentUser = currentUser;
        this.users = users;
        this.applications = applications;
        this.tasks = tasks;
        this.documents = documents;
        this.ai = ai;
    }

    @Transactional
    public ChatConversationResponse create(ChatConversationRequest request) {
        String title = request == null || request.title() == null || request.title().isBlank() ? "New conversation"
                : request.title().trim();
        return ChatConversationResponse
                .from(conversations.save(new ChatConversation(users.findById(currentUser.getUserId()), title)));
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> list() {
        return conversations.findByUser_IdOrderByUpdatedAtDesc(currentUser.getUserId()).stream()
                .map(ChatConversationResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> messages(Long conversationId) {
        ownedConversation(conversationId);
        return messages.findByConversationIdOrderByCreatedAtAsc(conversationId).stream().map(ChatMessageResponse::from)
                .toList();
    }

    public ChatExchangeResponse send(Long conversationId, ChatMessageRequest request) {
        ChatConversation conversation = ownedConversation(conversationId);
        ai.requireEnabled();
        Long userId = currentUser.getUserId();
        ChatMessage userMessage = messages
                .save(new ChatMessage(conversation, ChatMessage.Sender.USER, request.content().trim()));
        String answer;
        try {
            answer = ai.chat(request.content().trim(), buildOwnedContext(userId));
        } catch (RuntimeException exception) {
            messages.delete(userMessage);
            throw exception;
        }
        ChatMessage assistantMessage = messages
                .save(new ChatMessage(conversation, ChatMessage.Sender.ASSISTANT, answer));
        conversation.touch();
        conversations.save(conversation);
        if ("New conversation".equals(conversation.getTitle())) {
            String title = request.content().trim();
            conversation.setTitle(title.length() > 80 ? title.substring(0, 77) + "..." : title);
            conversations.save(conversation);
        }
        return new ChatExchangeResponse(ChatMessageResponse.from(userMessage),
                ChatMessageResponse.from(assistantMessage));
    }

    private String buildOwnedContext(Long userId) {
        var profile = UserProfileResponse.from(users.findById(userId));
        var applicationPage = applications.findAll(ApplicationSpecifications.forUser(userId, null, null),
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "updatedAt")));
        List<ApplicationResponse> ownApplications = applicationPage.getContent().stream().map(ApplicationResponse::from)
                .toList();
        List<TaskResponse> ownTasks = tasks.pendingForChat().stream().map(TaskResponse::from).toList();
        DateTimeFormatter dateFormat = DateTimeFormatter.ISO_LOCAL_DATE;
        return "Student skills: " + profile.skills() + "\nCareer goal: " + safe(profile.careerGoal()) +
                "\nApplications (maximum 20): "
                + ownApplications.stream().map(app -> app.companyName() + " / " + app.jobRole() +
                        " / " + app.status() + " / deadline "
                        + (app.deadline() == null ? "none" : app.deadline().format(dateFormat)) +
                        " / description " + safe(app.jobDescription())).toList()
                +
                "\nOpen tasks (maximum 20): "
                + ownTasks.stream().map(task -> task.title() + " / due " + task.dueDate() +
                        " / " + task.priority()
                        + (task.applicationId() == null ? "" : " / application " + task.applicationId())).toList()
                +
                "\nOwned resume and document reference text:\n" + documents.chatContext();
    }

    private ChatConversation ownedConversation(Long id) {
        return OwnershipGuard.require(conversations.findByIdAndUser_Id(id, currentUser.getUserId()),
                conversations.existsById(id), "conversation");
    }

    private static String safe(String value) {
        return value == null ? "not provided" : value;
    }
}