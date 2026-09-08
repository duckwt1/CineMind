package com.cinemind.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationStatsResponse {
    private long sentCount;
    private long receivedCount;
    private long sentCompletedCount;
    private long sentHelpfulCount;
    private double successRatePercentage;
    private Map<String, Object> topRecommenderFriend;
}
