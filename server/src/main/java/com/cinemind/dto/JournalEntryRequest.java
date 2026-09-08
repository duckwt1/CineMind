package com.cinemind.dto;

import com.cinemind.domain.enums.ViewingContext;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntryRequest {

    @Size(max = 10000, message = "Journal entry text cannot exceed 10000 characters")
    private String entryText;

    private ViewingContext viewingContext;

    @Size(max = 2000, message = "Private notes cannot exceed 2000 characters")
    private String privateNotes;
}
