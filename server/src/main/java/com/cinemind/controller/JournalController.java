package com.cinemind.controller;

import com.cinemind.common.ApiResponse;
import com.cinemind.dto.JournalEntryRequest;
import com.cinemind.dto.JournalEntryResponse;
import com.cinemind.security.UserPrincipal;
import com.cinemind.service.JournalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/library/{movieId}/journal")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    @GetMapping
    public ResponseEntity<ApiResponse<JournalEntryResponse>> getJournal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("movieId") UUID movieId
    ) {
        JournalEntryResponse response = journalService.getJournal(principal.getId(), movieId);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<JournalEntryResponse>> saveJournal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("movieId") UUID movieId,
            @Valid @RequestBody JournalEntryRequest request
    ) {
        JournalEntryResponse response = journalService.saveJournal(principal.getId(), movieId, request);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteJournal(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("movieId") UUID movieId
    ) {
        journalService.deleteJournal(principal.getId(), movieId);
        return ResponseEntity.noContent().build();
    }
}
