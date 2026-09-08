package com.cinemind.service;

import com.cinemind.common.ForbiddenException;
import com.cinemind.common.ResourceNotFoundException;
import com.cinemind.domain.entity.JournalEntry;
import com.cinemind.domain.entity.LibraryEntry;
import com.cinemind.domain.enums.ViewingContext;
import com.cinemind.dto.JournalEntryRequest;
import com.cinemind.dto.JournalEntryResponse;
import com.cinemind.repository.JournalEntryRepository;
import com.cinemind.repository.LibraryEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final LibraryEntryRepository libraryEntryRepository;

    public JournalEntryResponse getJournal(UUID userId, UUID movieId) {
        LibraryEntry libraryEntry = libraryEntryRepository.findByUserIdAndMovieId(userId, movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not in library"));

        // Enforce strict privacy (NFR-SEC-01)
        if (!libraryEntry.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Cannot access another user's private journal");
        }

        JournalEntry journal = journalEntryRepository.findByLibraryEntryId(libraryEntry.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No journal entry found for this movie"));

        return mapToResponse(journal);
    }

    @Transactional
    public JournalEntryResponse saveJournal(UUID userId, UUID movieId, JournalEntryRequest request) {
        LibraryEntry libraryEntry = libraryEntryRepository.findByUserIdAndMovieId(userId, movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not in library. Add it first before journaling."));

        if (!libraryEntry.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Cannot modify another user's journal");
        }

        JournalEntry journal = journalEntryRepository.findByLibraryEntryId(libraryEntry.getId())
                .orElse(JournalEntry.builder()
                        .libraryEntry(libraryEntry)
                        .viewingContext(ViewingContext.HOME_SOLO)
                        .build());

        if (request.getEntryText() != null) {
            journal.setEntryText(request.getEntryText());
        }
        if (request.getViewingContext() != null) {
            journal.setViewingContext(request.getViewingContext());
        }
        if (request.getPrivateNotes() != null) {
            journal.setPrivateNotes(request.getPrivateNotes());
        }

        journal = journalEntryRepository.save(journal);
        return mapToResponse(journal);
    }

    @Transactional
    public void deleteJournal(UUID userId, UUID movieId) {
        LibraryEntry libraryEntry = libraryEntryRepository.findByUserIdAndMovieId(userId, movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not in library"));

        if (!libraryEntry.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Cannot delete another user's journal");
        }

        JournalEntry journal = journalEntryRepository.findByLibraryEntryId(libraryEntry.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No journal entry found to delete"));

        journalEntryRepository.delete(journal);
    }

    public JournalEntryResponse mapToResponse(JournalEntry journal) {
        return JournalEntryResponse.builder()
                .id(journal.getId())
                .libraryEntryId(journal.getLibraryEntry().getId())
                .entryText(journal.getEntryText())
                .viewingContext(journal.getViewingContext())
                .privateNotes(journal.getPrivateNotes())
                .createdAt(journal.getCreatedAt())
                .updatedAt(journal.getUpdatedAt())
                .build();
    }
}
