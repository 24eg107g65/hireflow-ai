package com.hireflow.backend;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BackendApplicationTests {
	@Autowired
	private MockMvc mvc;
	@Autowired
	private ObjectMapper mapper;

	@Test
	void registerLoginAndProtectedProfileWork() throws Exception {
		JsonNode account = register("Jordan Lee");
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(
						Map.of("email", account.path("user").path("email").asText(), "password", "StrongPass123!"))))
				.andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").isNotEmpty());
		mvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(Map.of("refreshToken", account.path("refreshToken").asText()))))
				.andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").isNotEmpty());
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(Map.of("fullName", "Duplicate Student",
						"email", account.path("user").path("email").asText(), "password", "StrongPass123!"))))
				.andExpect(status().isConflict());
		mvc.perform(get("/api/users/me").header("Authorization", bearer(account.path("accessToken").asText())))
				.andExpect(status().isOk()).andExpect(jsonPath("$.fullName").value("Jordan Lee"));
	}

	@Test
	void invalidCredentialsAndMissingTokensAreUnauthorized() throws Exception {
		mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.status").value(401)).andExpect(jsonPath("$.path").value("/api/users/me"));
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"unknown@example.edu\",\"password\":\"bad-password\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Invalid email or password."));
	}

	@Test
	void applicationCrudIsOwnerScopedAndSupportsFilters() throws Exception {
		JsonNode owner = register("Owner One");
		JsonNode other = register("Owner Two");
		String body = "{\"companyName\":\"Northstar Labs\",\"jobRole\":\"Backend Intern\",\"applicationLink\":\"https://example.com/jobs/1\",\"deadline\":\"2026-11-02\",\"status\":\"INTERVIEW\",\"jobDescription\":\"Build reliable APIs\",\"notes\":\"Ask about observability\"}";
		MvcResult created = mvc
				.perform(post("/api/applications").header("Authorization", bearer(owner.path("accessToken").asText()))
						.contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.jobRole").value("Backend Intern")).andReturn();
		long id = json(created).path("id").asLong();
		mvc.perform(get("/api/applications").header("Authorization", bearer(owner.path("accessToken").asText()))
				.param("search", "northstar").param("status", "INTERVIEW").param("sortBy", "deadline")
				.param("direction", "asc"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.page").value(0));
		mvc.perform(
				get("/api/applications/{id}", id).header("Authorization", bearer(other.path("accessToken").asText())))
				.andExpect(status().isForbidden());
		mvc.perform(
				put("/api/applications/{id}", id).header("Authorization", bearer(other.path("accessToken").asText()))
						.contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isForbidden());
		mvc.perform(delete("/api/applications/{id}", id).header("Authorization",
				bearer(other.path("accessToken").asText())))
				.andExpect(status().isForbidden());
		mvc.perform(
				get("/api/applications/{id}", id).header("Authorization", bearer(owner.path("accessToken").asText())))
				.andExpect(status().isOk());
	}

	@Test
	void validationAndRefreshTokenPurposeAreEnforced() throws Exception {
		JsonNode account = register("Validation Student");
		mvc.perform(post("/api/applications").header("Authorization", bearer(account.path("accessToken").asText()))
				.contentType(MediaType.APPLICATION_JSON)
				.content(
						"{\"companyName\":\"\",\"jobRole\":\"\",\"applicationLink\":\"not-a-url\",\"status\":\"UNKNOWN\"}"))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors").isArray());
		mvc.perform(get("/api/users/me").header("Authorization", bearer(account.path("refreshToken").asText())))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void aiDisabledAndUploadValidationAreExplicit() throws Exception {
		JsonNode account = register("AI Student");
		MvcResult created = mvc.perform(post("/api/applications")
				.header("Authorization", bearer(account.path("accessToken").asText()))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"companyName\":\"Example Co\",\"jobRole\":\"Engineering Intern\",\"status\":\"SAVED\"}"))
				.andReturn();
		long applicationId = json(created).path("id").asLong();
		mvc.perform(post("/api/ai/applications/{id}/analyze-job", applicationId)
				.header("Authorization", bearer(account.path("accessToken").asText())))
				.andExpect(status().isServiceUnavailable())
				.andExpect(jsonPath("$.message").value("AI service is not configured."));
		MockMultipartFile textFile = new MockMultipartFile("file", "resume.txt", "text/plain",
				"not a resume".getBytes(StandardCharsets.UTF_8));
		mvc.perform(multipart("/api/resumes/upload").file(textFile).header("Authorization",
				bearer(account.path("accessToken").asText())))
				.andExpect(status().isUnsupportedMediaType());
	}

	@Test
	void dashboardReturnsTheAuthenticatedUsersSummary() throws Exception {
		JsonNode account = register("Dashboard Student");
		mvc.perform(get("/api/dashboard").header("Authorization", bearer(account.path("accessToken").asText())))
				.andExpect(status().isOk()).andExpect(jsonPath("$.totalApplications").value(0))
				.andExpect(jsonPath("$.applicationsByStatus.SAVED").value(0))
				.andExpect(jsonPath("$.recentApplications", hasSize(0)));
	}

	@Test
	void profileUpdatesAndRelatedRecordsRemainOwnerScoped() throws Exception {
		JsonNode owner = register("Profile Student");
		JsonNode other = register("Other Student");
		String ownerToken = bearer(owner.path("accessToken").asText());
		String otherToken = bearer(other.path("accessToken").asText());

		mvc.perform(put("/api/users/me").header("Authorization", ownerToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"fullName\":\"Jordan Career\",\"email\":\"" + owner.path("user").path("email").asText()
						+ "\",\"careerGoal\":\"Backend engineering\",\"preferredRoles\":[\"Backend Intern\"],\"skills\":[\"Java\",\"SQL\"],\"notificationPreference\":false}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.careerGoal").value("Backend engineering"))
				.andExpect(jsonPath("$.skills[0]").value("Java"))
				.andExpect(jsonPath("$.notificationPreference").value(false));

		MvcResult application = mvc.perform(post("/api/applications").header("Authorization", ownerToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"companyName\":\"Notes Inc\",\"jobRole\":\"Engineer\",\"status\":\"APPLIED\"}"))
				.andExpect(status().isCreated()).andReturn();
		long applicationId = json(application).path("id").asLong();
		MvcResult task = mvc.perform(post("/api/tasks").header("Authorization", ownerToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(
						"{\"title\":\"Send follow-up\",\"dueDate\":\"2026-10-20\",\"priority\":\"HIGH\",\"applicationId\":"
								+ applicationId + "}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.applicationId").value(applicationId))
				.andReturn();
		long taskId = json(task).path("id").asLong();
		mvc.perform(put("/api/tasks/{id}", taskId).header("Authorization", otherToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"Take over\",\"applicationId\":" + applicationId + "}"))
				.andExpect(status().isForbidden());

		MvcResult note = mvc
				.perform(post("/api/applications/{id}/notes", applicationId).header("Authorization", ownerToken)
						.contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Ask about on-call\"}"))
				.andExpect(status().isCreated()).andReturn();
		long noteId = json(note).path("id").asLong();
		mvc.perform(get("/api/applications/{id}/notes", applicationId).header("Authorization", ownerToken))
				.andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
		mvc.perform(delete("/api/notes/{id}", noteId).header("Authorization", otherToken))
				.andExpect(status().isForbidden());
	}

	@Test
	void validPdfResumeCanBeSetAsDefaultAndListed() throws Exception {
		JsonNode account = register("Resume Student");
		JsonNode other = register("Other Resume Student");
		String token = bearer(account.path("accessToken").asText());
		MockMultipartFile pdf = new MockMultipartFile("file", "resume.pdf", "application/pdf",
				"%PDF-1.4\n%EOF".getBytes(StandardCharsets.US_ASCII));
		MvcResult upload = mvc.perform(multipart("/api/resumes/upload").file(pdf).header("Authorization", token))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.isDefault").value(true))
				.andExpect(jsonPath("$.contentPath")
						.value(org.hamcrest.Matchers.matchesRegex("/api/resumes/[0-9]+/content")))
				.andReturn();
		long resumeId = json(upload).path("id").asLong();
		mvc.perform(get("/api/resumes").header("Authorization", token))
				.andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].originalFilename").value("resume.pdf"));
		String otherToken = bearer(other.path("accessToken").asText());
		mvc.perform(get("/api/resumes").header("Authorization", otherToken))
				.andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
		mvc.perform(get("/api/resumes/{id}/content", resumeId).header("Authorization", token))
				.andExpect(status().isOk())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
						.contentType(MediaType.APPLICATION_PDF))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
						.string("Content-Disposition", org.hamcrest.Matchers.containsString("inline")))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
						.bytes("%PDF-1.4\n%EOF".getBytes(StandardCharsets.US_ASCII)));
		mvc.perform(get("/api/resumes/{id}/content", resumeId).header("Authorization", otherToken))
				.andExpect(status().isForbidden());
		mvc.perform(put("/api/resumes/{id}/default", resumeId).header("Authorization", otherToken))
				.andExpect(status().isForbidden());
		mvc.perform(delete("/api/resumes/{id}", resumeId).header("Authorization", otherToken))
				.andExpect(status().isForbidden());
		MockMultipartFile secondPdf = new MockMultipartFile("file", "second.pdf", "application/pdf",
				"%PDF-1.4\nsecond\n%EOF".getBytes(StandardCharsets.US_ASCII));
		long secondId = json(
				mvc.perform(multipart("/api/resumes/upload").file(secondPdf).header("Authorization", token))
						.andExpect(status().isCreated()).andReturn())
				.path("id").asLong();
		mvc.perform(put("/api/resumes/{id}/default", secondId).header("Authorization", token))
				.andExpect(status().isNoContent());
		mvc.perform(get("/api/resumes").header("Authorization", token))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].isDefault").value(true))
				.andExpect(jsonPath("$[1].isDefault").value(false));
		mvc.perform(delete("/api/resumes/{id}", resumeId).header("Authorization", token))
				.andExpect(status().isNoContent());
		MockMultipartFile tooLarge = new MockMultipartFile("file", "large.pdf", "application/pdf",
				new byte[10 * 1024 * 1024 + 1]);
		mvc.perform(multipart("/api/resumes/upload").file(tooLarge)
				.header("Authorization", token))
				.andExpect(status().isPayloadTooLarge());
	}

	@Test
	void conversationsCannotBeAccessedAcrossUsersEvenWhenAiIsDisabled() throws Exception {
		JsonNode owner = register("Conversation Owner");
		JsonNode other = register("Conversation Other");
		MvcResult created = mvc.perform(post("/api/ai/chat/conversations")
				.header("Authorization", bearer(owner.path("accessToken").asText()))
				.contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Interview prep\"}"))
				.andExpect(status().isCreated()).andReturn();
		long conversationId = json(created).path("id").asLong();
		mvc.perform(get("/api/ai/chat/conversations/{id}/messages", conversationId)
				.header("Authorization", bearer(other.path("accessToken").asText())))
				.andExpect(status().isForbidden());
		mvc.perform(post("/api/ai/chat/conversations/{id}/messages", conversationId)
				.header("Authorization", bearer(other.path("accessToken").asText()))
				.contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Show me their applications\"}"))
				.andExpect(status().isForbidden());
	}

	private JsonNode register(String fullName) throws Exception {
		String email = UUID.randomUUID() + "@example.edu";
		MvcResult result = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content(mapper.writeValueAsString(
						Map.of("fullName", fullName, "email", email, "password", "StrongPass123!"))))
				.andExpect(status().isCreated()).andReturn();
		return json(result);
	}

	private JsonNode json(MvcResult result) throws Exception {
		return mapper.readTree(result.getResponse().getContentAsString());
	}

	private static String bearer(String token) {
		return "Bearer " + token;
	}
}
