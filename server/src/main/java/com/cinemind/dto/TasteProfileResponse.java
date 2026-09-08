package com.cinemind.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TasteProfileResponse {
    private Map<String, Integer> topGenres;
    private List<String> preferredKeywords;
    private Instant lastCalculatedAt;
}
