package com.cinemind.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationFeedbackRequest {

    @NotNull(message = "isHelpful flag is required")
    private Boolean isHelpful;

    private BigDecimal recipientRating;
}
