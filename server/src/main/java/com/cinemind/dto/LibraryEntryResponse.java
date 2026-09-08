package com.cinemind.dto;

import com.cinemind.domain.enums.LibraryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibraryEntryResponse {
    private UUID id;
    private MovieDto movie;
    private LibraryStatus status;
    private BigDecimal rating;
    private boolean isFavorite;
    private int rewatchCount;
    private List<String> tags;
    private LocalDate watchedDate;
    private boolean hasJournal;
    private Instant updatedAt;
}
