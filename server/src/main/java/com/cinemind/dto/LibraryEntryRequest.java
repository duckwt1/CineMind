package com.cinemind.dto;

import com.cinemind.domain.enums.LibraryStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibraryEntryRequest {

    @NotNull(message = "Movie ID is required")
    private UUID movieId;

    private LibraryStatus status;

    private BigDecimal rating;

    private Boolean isFavorite;

    private List<String> tags;

    private Integer rewatchCount;

    private LocalDate watchedDate;
}
