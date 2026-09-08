package com.cinemind.dto;

import com.cinemind.domain.enums.RecommendationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    private UUID id;
    private UserDto sender;
    private UserDto recipient;
    private MovieDto movie;
    private String message;
    private RecommendationStatus status;
    private Boolean isHelpful;
    private BigDecimal recipientRating;
    private Instant createdAt;
}
