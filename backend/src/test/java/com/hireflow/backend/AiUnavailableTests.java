package com.hireflow.backend;

import static org.junit.jupiter.api.Assertions.assertThrows;

import com.hireflow.backend.ai.AiService;
import com.hireflow.backend.exception.AiUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = { "app.ai.enabled=true", "spring.ai.model.chat=none" })
class AiUnavailableTests {
    @Autowired
    private AiService aiService;

    @Test
    void missingModelKeyDoesNotPreventStartupAndReportsUnavailable() {
        assertThrows(AiUnavailableException.class, aiService::requireEnabled);
    }
}