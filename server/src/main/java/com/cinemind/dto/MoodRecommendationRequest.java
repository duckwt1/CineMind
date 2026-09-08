package com.cinemind.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoodRecommendationRequest {

    @NotBlank(message = "Mood prompt cannot be blank")
    private String moodPrompt;
}
