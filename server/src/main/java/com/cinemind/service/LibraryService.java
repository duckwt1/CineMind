package com.cinemind.service;

import com.cinemind.common.BadRequestException;
import com.cinemind.common.ResourceNotFoundException;
import com.cinemind.domain.entity.LibraryEntry;
import com.cinemind.domain.entity.MovieCache;
import com.cinemind.domain.entity.MovieRecommendation;
import com.cinemind.domain.entity.User;
import com.cinemind.domain.enums.LibraryStatus;
import com.cinemind.domain.enums.RecommendationStatus;
import com.cinemind.dto.LibraryEntryRequest;
import com.cinemind.dto.LibraryEntryResponse;
import com.cinemind.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LibraryService {

    private final LibraryEntryRepository libraryEntryRepository;
    private final MovieCacheRepository movieCacheRepository;
    private final UserRepository userRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final MovieRecommendationRepository recommendationRepository;
    private final MovieService movieService;

    public List<LibraryEntryResponse> getLibrary(UUID userId, LibraryStatus statusFilter) {
        List<LibraryEntry> entries;
        if (statusFilter != null) {
            entries = libraryEntryRepository.findByUserIdAndStatus(userId, statusFilter);
        } else {
            entries = libraryEntryRepository.findByUserId(userId);
        }

        return entries.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public LibraryEntryResponse getEntry(UUID userId, UUID movieId) {
        LibraryEntry entry = libraryEntryRepository.findByUserIdAndMovieId(userId, movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not in library"));
        return mapToResponse(entry);
    }

    @Transactional
    public LibraryEntryResponse addOrUpdateEntry(UUID userId, LibraryEntryRequest request) {
        validateRating(request.getRating());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        MovieCache movie = movieCacheRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        LibraryEntry entry = libraryEntryRepository.findByUserIdAndMovieId(userId, request.getMovieId())
                .orElse(LibraryEntry.builder()
                        .user(user)
                        .movie(movie)
                        .status(LibraryStatus.WANT_TO_WATCH)
                        .build());

        LibraryStatus oldStatus = entry.getStatus();

        if (request.getStatus() != null) {
            // BR-LIB-02: Rewatch count increment when WATCHED -> WATCHING
            if (oldStatus == LibraryStatus.WATCHED && request.getStatus() == LibraryStatus.WATCHING) {
                entry.setRewatchCount(entry.getRewatchCount() + 1);
            }
            entry.setStatus(request.getStatus());
        }

        if (request.getRating() != null) {
            entry.setRating(request.getRating());
        }

        if (request.getIsFavorite() != null) {
            entry.setFavorite(request.getIsFavorite());
        }

        if (request.getTags() != null) {
            entry.setTags(request.getTags());
        }

        if (request.getRewatchCount() != null) {
            entry.setRewatchCount(request.getRewatchCount());
        }

        // BR-LIB-01: Auto populate watchedDate on WATCHED
        if (entry.getStatus() == LibraryStatus.WATCHED) {
            if (request.getWatchedDate() != null) {
                entry.setWatchedDate(request.getWatchedDate());
            } else if (entry.getWatchedDate() == null) {
                entry.setWatchedDate(LocalDate.now());
            }
        }

        entry = libraryEntryRepository.save(entry);

        // Sync recommendation lifecycle
        syncRecommendationLifecycle(userId, movie.getId(), entry.getStatus(), entry.getRating());

        return mapToResponse(entry);
    }

    @Transactional
    public void removeEntry(UUID userId, UUID movieId) {
        LibraryEntry entry = libraryEntryRepository.findByUserIdAndMovieId(userId, movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not in library"));
        libraryEntryRepository.delete(entry);
    }

    private void syncRecommendationLifecycle(UUID userId, UUID movieId, LibraryStatus status, BigDecimal rating) {
        List<MovieRecommendation> recs = recommendationRepository.findByRecipientIdAndMovieId(userId, movieId);
        for (MovieRecommendation rec : recs) {
            if (status == LibraryStatus.WANT_TO_WATCH && (rec.getStatus() == RecommendationStatus.PENDING || rec.getStatus() == RecommendationStatus.SEEN)) {
                rec.setStatus(RecommendationStatus.ADDED_TO_WATCHLIST);
                recommendationRepository.save(rec);
            } else if (status == LibraryStatus.WATCHED && rec.getStatus() != RecommendationStatus.RATED) {
                rec.setStatus(RecommendationStatus.WATCHED);
                if (rating != null) {
                    rec.setStatus(RecommendationStatus.RATED);
                    rec.setRecipientRating(rating);
                }
                recommendationRepository.save(rec);
            } else if (rating != null && rec.getStatus() != RecommendationStatus.RATED) {
                rec.setStatus(RecommendationStatus.RATED);
                rec.setRecipientRating(rating);
                recommendationRepository.save(rec);
            }
        }
    }

    private void validateRating(BigDecimal rating) {
        if (rating == null) return;
        if (rating.compareTo(BigDecimal.valueOf(1.0)) < 0 || rating.compareTo(BigDecimal.valueOf(10.0)) > 0) {
            throw new BadRequestException("Rating must be between 1.0 and 10.0");
        }
        double val = rating.doubleValue();
        if ((val * 2) != Math.floor(val * 2)) {
            throw new BadRequestException("Rating must be in increments of 0.5");
        }
    }

    public LibraryEntryResponse mapToResponse(LibraryEntry entry) {
        boolean hasJournal = journalEntryRepository.findByLibraryEntryId(entry.getId()).isPresent();
        return LibraryEntryResponse.builder()
                .id(entry.getId())
                .movie(movieService.mapToDto(entry.getMovie()))
                .status(entry.getStatus())
                .rating(entry.getRating())
                .isFavorite(entry.isFavorite())
                .rewatchCount(entry.getRewatchCount())
                .tags(entry.getTags())
                .watchedDate(entry.getWatchedDate())
                .hasJournal(hasJournal)
                .updatedAt(entry.getUpdatedAt())
                .build();
    }
}
