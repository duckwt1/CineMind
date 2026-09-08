package com.cinemind.controller;

import com.cinemind.common.ApiResponse;
import com.cinemind.dto.RecommendationStatsResponse;
import com.cinemind.dto.ViewingStatsResponse;
import com.cinemind.security.UserPrincipal;
import com.cinemind.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/viewing")
    public ResponseEntity<ApiResponse<ViewingStatsResponse>> getViewingStats(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ViewingStatsResponse response = statsService.getViewingStats(principal.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<RecommendationStatsResponse>> getRecommendationStats(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        RecommendationStatsResponse response = statsService.getRecommendationStats(principal.getId());
        return ResponseEntity.ok(ApiResponse.of(response));
    }
}
