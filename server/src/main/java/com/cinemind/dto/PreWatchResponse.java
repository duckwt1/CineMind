package com.cinemind.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreWatchResponse {
    private UUID movieId;
    private int matchScore;
    private String confidence;
    private List<String> reasonsToWatch;
    private List<String> potentialConcerns;
    private String tone;
    private String pacing;
    private String recommendedSetting;
    private boolean isSpoilerFree;
}
