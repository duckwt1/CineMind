package com.cinemind.controller;

import com.cinemind.common.ApiResponse;
import com.cinemind.domain.enums.RecommendationStatus;
import com.cinemind.dto.RecommendationFeedbackRequest;
import com.cinemind.dto.RecommendationResponse;
import com.cinemind.dto.SendRecommendationRequest;
import com.cinemind.security.UserPrincipal;
import com.cinemind.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @PostMapping
    public ResponseEntity<ApiResponse<RecommendationResponse>> sendRecommendation(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SendRecommendationRequest request
    ) {
        RecommendationResponse response = recommendationService.sendRecommendation(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response));
    }

    @GetMapping("/inbox")
    public ResponseEntity<ApiResponse<List<RecommendationResponse>>> getInbox(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "status", required = false) RecommendationStatus status
    ) {
        List<RecommendationResponse> list = recommendationService.getInbox(principal.getId(), status);
        return ResponseEntity.ok(ApiResponse.of(list));
    }

    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<List<RecommendationResponse>>> getSent(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<RecommendationResponse> list = recommendationService.getSent(principal.getId());
        return ResponseEntity.ok(ApiResponse.of(list));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RecommendationResponse>> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID id,
            @RequestBody Map<String, RecommendationStatus> body
    ) {
        RecommendationStatus newStatus = body.get("status");
        RecommendationResponse response = recommendationService.updateStatus(id, principal.getId(), newStatus);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PostMapping("/{id}/feedback")
    public ResponseEntity<ApiResponse<RecommendationResponse>> submitFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID id,
            @Valid @RequestBody RecommendationFeedbackRequest request
    ) {
        RecommendationResponse response = recommendationService.submitFeedback(id, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.of(response));
    }
}
