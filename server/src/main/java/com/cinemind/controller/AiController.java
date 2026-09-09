package com.cinemind.controller;

import com.cinemind.common.ApiResponse;
import com.cinemind.dto.MoodRecommendationRequest;
import com.cinemind.dto.PreWatchResponse;
import com.cinemind.dto.QaRequest;
import com.cinemind.dto.TasteProfileResponse;
import com.cinemind.security.UserPrincipal;
import com.cinemind.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/movies/{movieId}/pre-watch")
    public ResponseEntity<ApiResponse<PreWatchResponse>> getPreWatchAnalysis(
            @PathVariable("movieId") String movieId,
            @RequestParam(value = "spoilers", defaultValue = "false") boolean spoilers,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UUID userId = principal != null ? principal.getId() : null;
        PreWatchResponse response = aiService.getPreWatchAnalysis(movieId, spoilers, userId);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @GetMapping("/recommendations/for-you")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPersonalizedRecommendations(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "page", defaultValue = "1") int page
    ) {
        UUID userId = principal != null ? principal.getId() : null;
        List<Map<String, Object>> recs = aiService.getPersonalizedRecommendations(userId, page);
        return ResponseEntity.ok(ApiResponse.of(recs));
    }

    @PostMapping("/movies/{movieId}/qa")
    public ResponseEntity<ApiResponse<Map<String, Object>>> askMovieQuestion(
            @PathVariable("movieId") String movieId,
            @Valid @RequestBody QaRequest request
    ) {
        String answer = aiService.askQuestion(movieId, request.getQuery(), request.isSpoilersAllowed());
        return ResponseEntity.ok(ApiResponse.of(Map.of(
                "movieId", movieId,
                "answer", answer,
                "isSpoilerFree", !request.isSpoilersAllowed()
        )));
    }

    @PostMapping("/recommendations/mood")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMoodRecommendations(
            @Valid @RequestBody MoodRecommendationRequest request
    ) {
        List<Map<String, Object>> recs = aiService.getMoodRecommendations(request.getMoodPrompt());
        return ResponseEntity.ok(ApiResponse.of(recs));
    }

    @GetMapping("/taste-profile")
    public ResponseEntity<ApiResponse<TasteProfileResponse>> getTasteProfile(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        TasteProfileResponse response = aiService.getTasteProfile(principal.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @GetMapping("/taste-match/friend/{friendId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFriendTasteMatch(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("friendId") UUID friendId
    ) {
        Map<String, Object> response = aiService.getFriendTasteMatch(principal.getId(), friendId);
        return ResponseEntity.ok(ApiResponse.of(response));
    }
}
