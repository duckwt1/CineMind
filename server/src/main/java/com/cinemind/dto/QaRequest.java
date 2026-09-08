package com.cinemind.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaRequest {

    @NotBlank(message = "Query is required")
    @Size(max = 300, message = "Query cannot exceed 300 characters")
    private String query;

    private boolean spoilersAllowed;
}
