package com.cinemind.gateway;

import com.cinemind.domain.entity.MovieCache;
import com.cinemind.repository.MovieCacheRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class TmdbGateway {

    private final MovieCacheRepository movieCacheRepository;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${cinemind.tmdb.api-key:}")
    private String apiKey;

    @Value("${cinemind.tmdb.base-url:https://api.themoviedb.org/3}")
    private String baseUrl;

    private static final Map<Integer, String> GENRE_MAP = Map.ofEntries(
            Map.entry(28, "Action"),
            Map.entry(12, "Adventure"),
            Map.entry(16, "Animation"),
            Map.entry(35, "Comedy"),
            Map.entry(80, "Crime"),
            Map.entry(99, "Documentary"),
            Map.entry(18, "Drama"),
            Map.entry(10751, "Family"),
            Map.entry(14, "Fantasy"),
            Map.entry(36, "History"),
            Map.entry(27, "Horror"),
            Map.entry(10402, "Music"),
            Map.entry(9648, "Mystery"),
            Map.entry(10749, "Romance"),
            Map.entry(878, "Sci-Fi"),
            Map.entry(10770, "TV Movie"),
            Map.entry(53, "Thriller"),
            Map.entry(10752, "War"),
            Map.entry(37, "Western")
    );

    private String getNormalizedBaseUrl() {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "https://api.themoviedb.org/3";
        }
        String normalized = baseUrl.trim();
        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        if (!normalized.endsWith("/3")) {
            normalized = normalized + "/3";
        }
        return normalized;
    }

    public List<MovieCache> getTrending() {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String url = getNormalizedBaseUrl() + "/trending/movie/week?api_key=" + apiKey.trim() + "&language=en-US";
                log.info("Fetching trending movies from TMDB API: {}", getNormalizedBaseUrl());
                String responseBody = webClientBuilder.build()
                        .get()
                        .uri(url)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(10))
                        .block();

                List<MovieCache> movies = parseAndSaveMovieList(responseBody);
                if (!movies.isEmpty()) {
                    return movies;
                }
            } catch (Exception e) {
                log.warn("Failed to fetch trending movies from TMDB (falling back to cache): {}", e.getMessage());
            }
        }
        return movieCacheRepository.findAll();
    }

    public List<MovieCache> getPopular() {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String url = getNormalizedBaseUrl() + "/movie/popular?api_key=" + apiKey.trim() + "&language=en-US";
                String responseBody = webClientBuilder.build()
                        .get()
                        .uri(url)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(10))
                        .block();

                List<MovieCache> movies = parseAndSaveMovieList(responseBody);
                if (!movies.isEmpty()) {
                    return movies;
                }
            } catch (Exception e) {
                log.warn("Failed to fetch popular movies from TMDB: {}", e.getMessage());
            }
        }
        return movieCacheRepository.findAll();
    }

    public List<MovieCache> searchMovies(String query) {
        if (apiKey != null && !apiKey.isBlank() && query != null && !query.isBlank()) {
            try {
                String encodedQuery = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
                String url = getNormalizedBaseUrl() + "/search/movie?api_key=" + apiKey.trim() + "&query=" + encodedQuery + "&include_adult=false&language=en-US";
                log.info("Searching TMDB for query: {}", query);
                String responseBody = webClientBuilder.build()
                        .get()
                        .uri(url)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(10))
                        .block();

                List<MovieCache> movies = parseAndSaveMovieList(responseBody);
                if (!movies.isEmpty()) {
                    return movies;
                }
            } catch (Exception e) {
                log.warn("Failed to search movies from TMDB: {}", e.getMessage());
            }
        }

        // Fallback to local database search
        return movieCacheRepository.findByTitleContainingIgnoreCase(query);
    }

    public Optional<MovieCache> getMovieDetails(String idOrExternalId) {
        // 1. Try resolving by UUID from database
        try {
            Optional<MovieCache> byId = movieCacheRepository.findById(UUID.fromString(idOrExternalId));
            if (byId.isPresent()) {
                MovieCache movie = byId.get();
                // If details like director or cast are already populated, return directly
                if (movie.getDirector() != null && !movie.getDirector().isBlank()) {
                    return Optional.of(movie);
                }
                // Otherwise try enriching from TMDB if externalId available
                if (movie.getExternalId() != null && apiKey != null && !apiKey.isBlank()) {
                    enrichMovieFromTmdb(movie);
                    return Optional.of(movieCacheRepository.save(movie));
                }
                return Optional.of(movie);
            }
        } catch (IllegalArgumentException ignored) {
            // Not a UUID, check externalId
        }

        // 2. Try resolving by externalId
        Optional<MovieCache> byExternalId = movieCacheRepository.findByExternalId(idOrExternalId);
        if (byExternalId.isPresent()) {
            return byExternalId;
        }

        // 3. If numeric or tmdb-xxx, query TMDB directly
        if (apiKey != null && !apiKey.isBlank()) {
            String tmdbId = idOrExternalId.replace("tmdb-", "").trim();
            try {
                String url = getNormalizedBaseUrl() + "/movie/" + tmdbId + "?api_key=" + apiKey.trim() + "&append_to_response=credits&language=en-US";
                String responseBody = webClientBuilder.build()
                        .get()
                        .uri(url)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(10))
                        .block();

                MovieCache movie = parseFullMovieDetails(responseBody, tmdbId);
                if (movie != null) {
                    return Optional.of(movieCacheRepository.save(movie));
                }
            } catch (Exception e) {
                log.warn("Failed to fetch movie details from TMDB: {}", e.getMessage());
            }
        }

        return Optional.empty();
    }

    private List<MovieCache> parseAndSaveMovieList(String json) {
        List<MovieCache> result = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode results = root.path("results");
            if (results.isArray()) {
                for (JsonNode node : results) {
                    long tmdbId = node.path("id").asLong();
                    String externalId = "tmdb-" + tmdbId;
                    String title = node.path("title").asText(node.path("name").asText("Unknown"));
                    String synopsis = node.path("overview").asText("");
                    String posterPath = node.path("poster_path").isNull() ? null : node.path("poster_path").asText(null);
                    String backdropPath = node.path("backdrop_path").isNull() ? null : node.path("backdrop_path").asText(null);

                    Integer releaseYear = null;
                    String releaseDate = node.path("release_date").asText("");
                    if (releaseDate.length() >= 4) {
                        try {
                            releaseYear = Integer.parseInt(releaseDate.substring(0, 4));
                        } catch (Exception ignored) {}
                    }

                    List<String> genres = new ArrayList<>();
                    JsonNode genreIds = node.path("genre_ids");
                    if (genreIds.isArray()) {
                        for (JsonNode gId : genreIds) {
                            String name = GENRE_MAP.get(gId.asInt());
                            if (name != null) {
                                genres.add(name);
                            }
                        }
                    }

                    // Check if already in DB
                    Optional<MovieCache> existingOpt = movieCacheRepository.findByExternalId(externalId);
                    if (existingOpt.isPresent()) {
                        result.add(existingOpt.get());
                    } else {
                        MovieCache newMovie = MovieCache.builder()
                                .externalId(externalId)
                                .title(title)
                                .releaseYear(releaseYear)
                                .synopsis(synopsis)
                                .posterPath(posterPath)
                                .backdropPath(backdropPath)
                                .genres(genres)
                                .build();
                        try {
                            MovieCache saved = movieCacheRepository.save(newMovie);
                            result.add(saved);
                        } catch (Exception e) {
                            // If concurrent insert conflict, read existing
                            movieCacheRepository.findByExternalId(externalId).ifPresent(result::add);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error parsing TMDB movie list: {}", e.getMessage());
        }
        return result;
    }

    private void enrichMovieFromTmdb(MovieCache movie) {
        try {
            String tmdbId = movie.getExternalId().replace("tmdb-", "").trim();
            String url = getNormalizedBaseUrl() + "/movie/" + tmdbId + "?api_key=" + apiKey.trim() + "&append_to_response=credits&language=en-US";
            String json = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            JsonNode root = objectMapper.readTree(json);
            if (root.hasNonNull("runtime")) {
                movie.setRuntimeMinutes(root.get("runtime").asInt());
            }

            JsonNode credits = root.path("credits");
            JsonNode crew = credits.path("crew");
            if (crew.isArray()) {
                for (JsonNode member : crew) {
                    if ("Director".equalsIgnoreCase(member.path("job").asText())) {
                        movie.setDirector(member.path("name").asText());
                        break;
                    }
                }
            }

            JsonNode cast = credits.path("cast");
            if (cast.isArray()) {
                List<String> castList = new ArrayList<>();
                int count = 0;
                for (JsonNode actor : cast) {
                    String name = actor.path("name").asText();
                    if (!name.isBlank()) {
                        castList.add(name);
                        count++;
                        if (count >= 5) break;
                    }
                }
                movie.setCastMembers(castList);
            }
        } catch (Exception e) {
            log.warn("Could not enrich movie {} from TMDB: {}", movie.getTitle(), e.getMessage());
        }
    }

    private MovieCache parseFullMovieDetails(String json, String tmdbId) {
        try {
            JsonNode root = objectMapper.readTree(json);
            String externalId = "tmdb-" + tmdbId;
            String title = root.path("title").asText("Unknown");
            String synopsis = root.path("overview").asText("");
            String posterPath = root.path("poster_path").isNull() ? null : root.path("poster_path").asText(null);
            String backdropPath = root.path("backdrop_path").isNull() ? null : root.path("backdrop_path").asText(null);
            Integer runtime = root.hasNonNull("runtime") ? root.get("runtime").asInt() : null;

            Integer releaseYear = null;
            String releaseDate = root.path("release_date").asText("");
            if (releaseDate.length() >= 4) {
                try {
                    releaseYear = Integer.parseInt(releaseDate.substring(0, 4));
                } catch (Exception ignored) {}
            }

            List<String> genres = new ArrayList<>();
            JsonNode genresNode = root.path("genres");
            if (genresNode.isArray()) {
                for (JsonNode g : genresNode) {
                    genres.add(g.path("name").asText());
                }
            }

            String director = null;
            JsonNode crew = root.path("credits").path("crew");
            if (crew.isArray()) {
                for (JsonNode member : crew) {
                    if ("Director".equalsIgnoreCase(member.path("job").asText())) {
                        director = member.path("name").asText();
                        break;
                    }
                }
            }

            List<String> cast = new ArrayList<>();
            JsonNode castNode = root.path("credits").path("cast");
            if (castNode.isArray()) {
                int count = 0;
                for (JsonNode actor : castNode) {
                    String name = actor.path("name").asText();
                    if (!name.isBlank()) {
                        cast.add(name);
                        count++;
                        if (count >= 5) break;
                    }
                }
            }

            return MovieCache.builder()
                    .externalId(externalId)
                    .title(title)
                    .releaseYear(releaseYear)
                    .runtimeMinutes(runtime)
                    .synopsis(synopsis)
                    .posterPath(posterPath)
                    .backdropPath(backdropPath)
                    .director(director)
                    .genres(genres)
                    .castMembers(cast)
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse full movie details: {}", e.getMessage());
            return null;
        }
    }
}