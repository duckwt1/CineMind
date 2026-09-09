package com.cinemind.service;

import com.cinemind.common.ResourceNotFoundException;
import com.cinemind.domain.entity.MovieCache;
import com.cinemind.dto.MovieDto;
import com.cinemind.gateway.GeminiGateway;
import com.cinemind.gateway.TmdbGateway;
import com.cinemind.repository.MovieCacheRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MovieService {

    private final TmdbGateway tmdbGateway;
    private final GeminiGateway geminiGateway;
    private final MovieCacheRepository movieCacheRepository;

    public List<MovieDto> searchMovies(String query) {
        return searchMovies(query, 1);
    }

    public List<MovieDto> searchMovies(String query, int page) {
        return tmdbGateway.searchMovies(query, page).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<MovieDto> searchSemantic(String query, int limit) {
        if (query == null || query.isBlank()) {
            return getTrending();
        }

        List<MovieDto> results = new ArrayList<>();

        // 1. Generate embedding for user natural search query
        float[] queryVector = geminiGateway.generateEmbedding(query);
        if (queryVector != null) {
            String vectorStr = formatVector(queryVector);
            // Minimum cosine similarity threshold of 0.40 (40%) to ensure high semantic relevance
            List<MovieCache> nearest = movieCacheRepository.findNearestByEmbedding(vectorStr, 0.40, limit);
            if (!nearest.isEmpty()) {
                log.info("Found {} semantic vector matches for query '{}'", nearest.size(), query);
                int rank = 0;
                for (MovieCache m : nearest) {
                    MovieDto dto = mapToDto(m);
                    // Decaying similarity score from top match
                    dto.setSimilarityScore(Math.max(65, 96 - (rank * 4)));
                    results.add(dto);
                    rank++;
                }
            }
        }

        // 2. Hybrid Discovery: If DB has fewer than 3 semantic results, search TMDB, auto-embed them, and merge
        if (results.size() < 4) {
            log.info("Expanding semantic search query '{}' via TMDB discovery...", query);
            List<MovieCache> tmdbMatches = tmdbGateway.searchMovies(query);
            for (MovieCache m : tmdbMatches) {
                boolean alreadyInResults = results.stream().anyMatch(r -> r.getId().equals(m.getId()) || r.getExternalId().equals(m.getExternalId()));
                if (!alreadyInResults) {
                    ensureMovieEmbedding(m); // Auto-embed newly discovered TMDB movie!
                    MovieDto dto = mapToDto(m);
                    dto.setSimilarityScore(88);
                    results.add(dto);
                    if (results.size() >= limit) break;
                }
            }
        }

        return results.isEmpty() ? searchMovies(query) : results;
    }

    @Transactional
    public void ensureMovieEmbedding(MovieCache movie) {
        if (movie == null || movie.getId() == null) return;
        try {
            String textToEmbed = buildMovieEmbeddingText(movie);
            if (!textToEmbed.isBlank()) {
                float[] vec = geminiGateway.generateEmbedding(textToEmbed);
                if (vec != null) {
                    movieCacheRepository.updateEmbedding(movie.getId(), formatVector(vec));
                    log.info("Embedded movie '{}' (dim: {})", movie.getTitle(), vec.length);
                }
            }
        } catch (Exception e) {
            log.warn("Could not generate embedding for movie {}: {}", movie.getTitle(), e.getMessage());
        }
    }

    private String buildMovieEmbeddingText(MovieCache movie) {
        StringBuilder sb = new StringBuilder();
        if (movie.getTitle() != null) sb.append("Title: ").append(movie.getTitle()).append(". ");
        if (movie.getGenres() != null && !movie.getGenres().isEmpty()) {
            sb.append("Genres: ").append(String.join(", ", movie.getGenres())).append(". ");
        }
        if (movie.getDirector() != null) sb.append("Director: ").append(movie.getDirector()).append(". ");
        if (movie.getSynopsis() != null) sb.append("Synopsis: ").append(movie.getSynopsis());
        return sb.toString();
    }

    private String formatVector(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    public List<MovieDto> getTrending() {
        return getTrending(1);
    }

    public List<MovieDto> getTrending(int page) {
        return tmdbGateway.getTrending(page).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<MovieDto> getPopular() {
        return getPopular(1);
    }

    public List<MovieDto> getPopular(int page) {
        return tmdbGateway.getPopular(page).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public MovieDto getMovieDetails(String idOrExternalId) {
        MovieCache movie = tmdbGateway.getMovieDetails(idOrExternalId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found in catalog"));
        return mapToDto(movie);
    }

    public MovieDto mapToDto(MovieCache movie) {
        return MovieDto.builder()
                .id(movie.getId())
                .externalId(movie.getExternalId())
                .title(movie.getTitle())
                .releaseYear(movie.getReleaseYear())
                .runtimeMinutes(movie.getRuntimeMinutes())
                .genres(movie.getGenres())
                .director(movie.getDirector())
                .cast(movie.getCastMembers())
                .synopsis(movie.getSynopsis())
                .posterUrl(movie.getPosterPath() != null ? "https://image.tmdb.org/t/p/w500" + movie.getPosterPath() : null)
                .backdropUrl(movie.getBackdropPath() != null ? "https://image.tmdb.org/t/p/w1280" + movie.getBackdropPath() : null)
                .build();
    }
}
