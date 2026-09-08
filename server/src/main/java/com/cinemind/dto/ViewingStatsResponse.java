package com.cinemind.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViewingStatsResponse {
    private long totalMoviesWatched;
    private long totalWatchTimeMinutes;
    private Double averageRating;
    private List<Map<String, Object>> topGenres;
    private Map<String, Long> ratingDistribution;
}
