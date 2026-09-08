package com.cinemind.controller;

import com.cinemind.common.ApiResponse;
import com.cinemind.domain.enums.LibraryStatus;
import com.cinemind.dto.LibraryEntryRequest;
import com.cinemind.dto.LibraryEntryResponse;
import com.cinemind.security.UserPrincipal;
import com.cinemind.service.LibraryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/library")
@RequiredArgsConstructor
public class LibraryController {

    private final LibraryService libraryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LibraryEntryResponse>>> getLibrary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "status", required = false) LibraryStatus status
    ) {
        List<LibraryEntryResponse> list = libraryService.getLibrary(principal.getId(), status);
        return ResponseEntity.ok(ApiResponse.of(list));
    }

    @GetMapping("/{movieId}")
    public ResponseEntity<ApiResponse<LibraryEntryResponse>> getEntry(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("movieId") UUID movieId
    ) {
        LibraryEntryResponse response = libraryService.getEntry(principal.getId(), movieId);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LibraryEntryResponse>> addOrUpdateEntry(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LibraryEntryRequest request
    ) {
        LibraryEntryResponse response = libraryService.addOrUpdateEntry(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response));
    }

    @PatchMapping("/{movieId}")
    public ResponseEntity<ApiResponse<LibraryEntryResponse>> updateEntry(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("movieId") UUID movieId,
            @RequestBody LibraryEntryRequest request
    ) {
        request.setMovieId(movieId);
        LibraryEntryResponse response = libraryService.addOrUpdateEntry(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.of(response));
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<Void> removeEntry(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("movieId") UUID movieId
    ) {
        libraryService.removeEntry(principal.getId(), movieId);
        return ResponseEntity.noContent().build();
    }
}
