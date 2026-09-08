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
public class MovieDto {
    private UUID id;
    private String externalId;
    private String title;
    private Integer releaseYear;
    private Integer runtimeMinutes;
    private List<String> genres;
    private String director;
    private List<String> cast;
    private String synopsis;
    private String posterUrl;
    private String backdropUrl;
    private Integer similarityScore; // 0 - 100% semantic match
}
