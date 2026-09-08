package com.cinemind.dto;

import com.cinemind.domain.enums.ViewingContext;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntryResponse {
    private UUID id;
    private UUID libraryEntryId;
    private String entryText;
    private ViewingContext viewingContext;
    private String privateNotes;
    private Instant createdAt;
    private Instant updatedAt;
}
