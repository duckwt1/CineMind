package com.cinemind.gateway;

import com.cinemind.domain.entity.MovieCache;
import com.cinemind.dto.PreWatchResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiGateway {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${cinemind.gemini.api-key:}")
    private String apiKey;

    @Value("${cinemind.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    public PreWatchResponse generatePreWatchAnalysis(MovieCache movie, boolean spoilersAllowed) {
        log.info("Generating pre-watch analysis for '{}' (spoilersAllowed: {})", movie.getTitle(), spoilersAllowed);

        if (apiKey != null && !apiKey.isBlank() && !apiKey.contains("your_gemini")) {
            try {
                String prompt = buildPreWatchPrompt(movie, spoilersAllowed);
                String geminiResponse = callGeminiApi(prompt);
                PreWatchResponse parsed = parsePreWatchResponse(geminiResponse, movie.getId(), spoilersAllowed);
                if (parsed != null) {
                    return parsed;
                }
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to curated template: {}", e.getMessage());
            }
        }

        // Fallback curated pre-watch response
        List<String> reasons = Arrays.asList(
                "Distinctive visual direction and cinematic atmosphere",
                "Compelling narrative tension with authentic emotional stakes",
                "Strong ensemble performances elevating the script"
        );

        List<String> concerns = Arrays.asList(
                "May require focused immersion for full impact",
                "Pacing matches deliberate genre conventions"
        );

        return PreWatchResponse.builder()
                .movieId(movie.getId())
                .matchScore(88)
                .confidence("HIGH")
                .reasonsToWatch(reasons)
                .potentialConcerns(concerns)
                .tone("Atmospheric & Engaging")
                .pacing("Deliberate & Controlled")
                .recommendedSetting("Best experienced in a focused, distraction-free environment")
                .isSpoilerFree(!spoilersAllowed)
                .build();
    }

    public String answerMovieQuestion(MovieCache movie, String question, boolean spoilersAllowed) {
        log.info("Answering Q&A for movie '{}': '{}' (spoilersAllowed: {})", movie.getTitle(), question, spoilersAllowed);

        if (apiKey != null && !apiKey.isBlank() && !apiKey.contains("your_gemini")) {
            try {
                String prompt = buildQaPrompt(movie, question, spoilersAllowed);
                String geminiResponse = callGeminiApi(prompt);
                String parsedAnswer = parseQaResponse(geminiResponse);
                if (parsedAnswer != null && !parsedAnswer.isBlank()) {
                    return parsedAnswer;
                }
            } catch (Exception e) {
                log.warn("Gemini Q&A failed, falling back to rule-based answer: {}", e.getMessage());
            }
        }

        // Fallback rule-based answering
        String lowerQuery = question.toLowerCase();
        if (!spoilersAllowed && (lowerQuery.contains("twist") || lowerQuery.contains("ending") || lowerQuery.contains("die") || lowerQuery.contains("killer"))) {
            return "To protect your first-time viewing experience, spoilers are strictly quarantined. Tap the 'Override' button above if you wish to see ending twists.";
        }

        if (lowerQuery.contains("scary") || lowerQuery.contains("jump scare")) {
            return "The film contains high atmospheric tension and dramatic conflict, without relying on cheap jump scares.";
        }

        return "This film delivers an engaging experience with deliberate tone and strong thematic development. Highly recommended for fans of " + (movie.getGenres() != null && !movie.getGenres().isEmpty() ? String.join(", ", movie.getGenres()) : "cinema") + ".";
    }

    private String callGeminiApi(String promptText) {
        String cleanBaseUrl = baseUrl.trim();
        while (cleanBaseUrl.endsWith("/")) {
            cleanBaseUrl = cleanBaseUrl.substring(0, cleanBaseUrl.length() - 1);
        }
        String url = cleanBaseUrl + "/models/gemini-3.6-flash:generateContent?key=" + apiKey.trim();

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", promptText)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.4,
                        "maxOutputTokens", 1200
                )
        );

        return webClientBuilder.build()
                .post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(15))
                .block();
    }

    public float[] generateEmbedding(String text) {
        if (apiKey == null || apiKey.isBlank() || text == null || text.isBlank()) {
            return null;
        }

        try {
            String cleanBaseUrl = baseUrl.trim();
            while (cleanBaseUrl.endsWith("/")) {
                cleanBaseUrl = cleanBaseUrl.substring(0, cleanBaseUrl.length() - 1);
            }
            String url = cleanBaseUrl + "/models/gemini-embedding-001:embedContent?key=" + apiKey.trim();

            Map<String, Object> body = Map.of(
                    "model", "models/gemini-embedding-001",
                    "content", Map.of("parts", List.of(Map.of("text", text.length() > 2000 ? text.substring(0, 2000) : text))),
                    "outputDimensionality", 768
            );

            String jsonResponse = webClientBuilder.build()
                    .post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (jsonResponse != null) {
                JsonNode root = objectMapper.readTree(jsonResponse);
                JsonNode valuesNode = root.path("embedding").path("values");
                if (valuesNode.isArray() && valuesNode.size() > 0) {
                    float[] embedding = new float[valuesNode.size()];
                    for (int i = 0; i < valuesNode.size(); i++) {
                        embedding[i] = (float) valuesNode.get(i).asDouble();
                    }
                    return embedding;
                }
            }
        } catch (Exception e) {
            log.warn("Gemini embedding generation failed: {}", e.getMessage());
        }
        return null;
    }

    private String buildPreWatchPrompt(MovieCache movie, boolean spoilersAllowed) {
        return "You are CineMind AI, an elite film analyst. Analyze this movie for a viewer considering watching it:\n" +
                "Title: " + movie.getTitle() + " (" + (movie.getReleaseYear() != null ? movie.getReleaseYear() : "") + ")\n" +
                "Director: " + (movie.getDirector() != null ? movie.getDirector() : "Unknown") + "\n" +
                "Genres: " + (movie.getGenres() != null ? String.join(", ", movie.getGenres()) : "") + "\n" +
                "Synopsis: " + movie.getSynopsis() + "\n\n" +
                "STRICT SPOILER POLICY: " + (spoilersAllowed ? "SPOILERS ALLOWED. You may discuss plot twists and climax." : "STRICTLY SPOILER-FREE. NEVER reveal any ending, plot twists, character deaths, or secret identities.") + "\n\n" +
                "Respond ONLY with valid JSON following this exact structure without markdown backticks:\n" +
                "{\n" +
                "  \"matchScore\": 89,\n" +
                "  \"confidence\": \"HIGH\",\n" +
                "  \"reasonsToWatch\": [\"Compelling reason 1\", \"Compelling reason 2\", \"Compelling reason 3\"],\n" +
                "  \"potentialConcerns\": [\"Honest caution 1\", \"Honest caution 2\"],\n" +
                "  \"tone\": \"Atmospheric, Tense, Thought-provoking\",\n" +
                "  \"pacing\": \"Deliberate build-up with intense crescendo\",\n" +
                "  \"recommendedSetting\": \"Watch in a quiet room with quality audio\"\n" +
                "}";
    }

    private String buildQaPrompt(MovieCache movie, String question, boolean spoilersAllowed) {
        return "You are CineMind AI, a helpful film companion. Answer the user's specific question about this movie:\n" +
                "Title: " + movie.getTitle() + "\n" +
                "Synopsis: " + movie.getSynopsis() + "\n" +
                "User Question: \"" + question + "\"\n\n" +
                "SPOILER POLICY: " + (spoilersAllowed ? "Spoilers are allowed." : "SPOILERS ARE STRICTLY FORBIDDEN. Do NOT reveal twists, endings, or killer identity. If the user explicitly asks for a spoiler, politely tell them to enable spoiler mode.") + "\n\n" +
                "Answer concisely in 2-3 engaging, clear sentences.";
    }

    private PreWatchResponse parsePreWatchResponse(String json, UUID movieId, boolean spoilersAllowed) {
        try {
            JsonNode root = objectMapper.readTree(json);
            String rawText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText("");
            // Strip any markdown code fences if model enclosed it
            String cleanJson = rawText.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode parsed = objectMapper.readTree(cleanJson);

            int matchScore = parsed.path("matchScore").asInt(88);
            String confidence = parsed.path("confidence").asText("HIGH");
            String tone = parsed.path("tone").asText("Atmospheric");
            String pacing = parsed.path("pacing").asText("Deliberate");
            String setting = parsed.path("recommendedSetting").asText("Home cinema");

            List<String> reasons = new ArrayList<>();
            JsonNode reasonsNode = parsed.path("reasonsToWatch");
            if (reasonsNode.isArray()) {
                for (JsonNode r : reasonsNode) reasons.add(r.asText());
            }

            List<String> concerns = new ArrayList<>();
            JsonNode concernsNode = parsed.path("potentialConcerns");
            if (concernsNode.isArray()) {
                for (JsonNode c : concernsNode) concerns.add(c.asText());
            }

            return PreWatchResponse.builder()
                    .movieId(movieId)
                    .matchScore(matchScore)
                    .confidence(confidence)
                    .reasonsToWatch(reasons.isEmpty() ? List.of("Engaging storytelling") : reasons)
                    .potentialConcerns(concerns.isEmpty() ? List.of("Standard runtime") : concerns)
                    .tone(tone)
                    .pacing(pacing)
                    .recommendedSetting(setting)
                    .isSpoilerFree(!spoilersAllowed)
                    .build();
        } catch (Exception e) {
            log.warn("Could not parse Gemini JSON response: {}", e.getMessage());
            return null;
        }
    }

    private String parseQaResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        } catch (Exception e) {
            return null;
        }
    }
}