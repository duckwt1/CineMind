package com.cinemind.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendRecommendationRequest {

    @NotNull(message = "Recipient ID is required")
    private UUID recipientId;

    @NotNull(message = "Movie ID is required")
    private UUID movieId;

    @Size(max = 500, message = "Personal note cannot exceed 500 characters")
    private String message;
}
