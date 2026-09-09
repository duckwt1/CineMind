package com.cinemind.service;

import com.cinemind.common.ResourceNotFoundException;
import com.cinemind.domain.entity.LibraryEntry;
import com.cinemind.domain.entity.MovieCache;
import com.cinemind.domain.entity.TasteProfile;
import com.cinemind.dto.MovieDto;
import com.cinemind.dto.PreWatchResponse;
import com.cinemind.dto.TasteProfileResponse;
import com.cinemind.gateway.GeminiGateway;
import com.cinemind.gateway.TmdbGateway;
import com.cinemind.repository.LibraryEntryRepository;
import com.cinemind.repository.TasteProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiService {

    private final GeminiGateway geminiGateway;
    private final TmdbGateway tmdbGateway;
    private final TasteProfileRepository tasteProfileRepository;
    private final LibraryEntryRepository libraryEntryRepository;
    private final MovieService movieService;

    public PreWatchResponse getPreWatchAnalysis(String movieId, boolean spoilersAllowed) {
        return getPreWatchAnalysis(movieId, spoilersAllowed, null);
    }

    public PreWatchResponse getPreWatchAnalysis(String movieId, boolean spoilersAllowed, UUID userId) {
        MovieCache movie = tmdbGateway.getMovieDetails(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        // Pre-embed movie asynchronously if not already embedded
        movieService.ensureMovieEmbedding(movie);

        String tasteContext = null;
        if (userId != null) {
            List<LibraryEntry> library = libraryEntryRepository.findByUserId(userId);
            if (!library.isEmpty()) {
                Map<String, Integer> genreWeights = extractGenreWeights(library);
                List<String> topFavTitles = library.stream()
                        .filter(e -> (e.isFavorite() || (e.getRating() != null && e.getRating().doubleValue() >= 8.0)))
                        .map(e -> e.getMovie() != null ? e.getMovie().getTitle() : null)
                        .filter(Objects::nonNull)
                        .limit(5)
                        .toList();

                tasteContext = "User favorite films: " + String.join(", ", topFavTitles)
                        + "\nUser top genres: " + genreWeights.entrySet().stream()
                        .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                        .limit(4)
                        .map(e -> e.getKey() + " (weight: " + e.getValue() + ")")
                        .toList();
            }
        }

        return geminiGateway.generatePreWatchAnalysis(movie, spoilersAllowed, tasteContext);
    }

    public List<Map<String, Object>> getPersonalizedRecommendations(UUID userId, int page) {
        List<LibraryEntry> library = libraryEntryRepository.findByUserId(userId);
        Set<String> alreadyInLibraryIds = new HashSet<>();
        for (LibraryEntry entry : library) {
            if (entry.getMovie() != null) {
                if (entry.getMovie().getId() != null) alreadyInLibraryIds.add(entry.getMovie().getId().toString());
                if (entry.getMovie().getExternalId() != null) alreadyInLibraryIds.add(entry.getMovie().getExternalId());
            }
        }

        Map<String, Integer> genreWeights = extractGenreWeights(library);
        List<String> topGenres = genreWeights.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(3)
                .map(Map.Entry::getKey)
                .toList();

        if (topGenres.isEmpty()) {
            topGenres = List.of("Sci-Fi", "Drama", "Thriller");
        }

        // 1. Fetch discovery candidates from TMDB
        List<MovieCache> candidates = tmdbGateway.discoverMoviesByGenres(topGenres, page);

        List<Map<String, Object>> recs = new ArrayList<>();
        int rank = 0;
        for (MovieCache c : candidates) {
            if (alreadyInLibraryIds.contains(c.getId() != null ? c.getId().toString() : "")
                    || (c.getExternalId() != null && alreadyInLibraryIds.contains(c.getExternalId()))) {
                continue;
            }

            MovieDto dto = movieService.mapToDto(c);
            int score = Math.max(76, 98 - (rank * 2)); // Dynamic match score gradient
            dto.setSimilarityScore(score);

            Map<String, Object> item = new HashMap<>();
            item.put("movie", dto);
            item.put("matchScore", score);
            item.put("matchedGenres", c.getGenres() != null ? c.getGenres().stream().filter(topGenres::contains).toList() : List.of());
            item.put("aiPitch", "Được đề xuất dựa trên sở thích của bạn với thể loại " + String.join(", ", topGenres) + ".");
            recs.add(item);
            rank++;
            if (recs.size() >= 12) break;
        }

        return recs;
    }

    public String askQuestion(String movieId, String query, boolean spoilersAllowed) {
        MovieCache movie = tmdbGateway.getMovieDetails(movieId)
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        return geminiGateway.answerMovieQuestion(movie, query, spoilersAllowed);
    }

    public List<Map<String, Object>> getMoodRecommendations(String moodPrompt) {
        List<MovieDto> semanticMovies = movieService.searchSemantic(moodPrompt, 6);
        List<Map<String, Object>> recommendations = new ArrayList<>();

        for (MovieDto movie : semanticMovies) {
            Map<String, Object> rec = new HashMap<>();
            rec.put("movie", movie);
            rec.put("matchScore", 92);
            rec.put("aiPitch", "Rất phù hợp với tâm trạng '" + moodPrompt + "' của bạn với bầu không khí điện ảnh lôi cuốn và cốt truyện hấp dẫn.");
            recommendations.add(rec);
            if (recommendations.size() >= 4) break;
        }

        return recommendations;
    }

    public TasteProfileResponse getTasteProfile(UUID userId) {
        List<LibraryEntry> library = libraryEntryRepository.findByUserId(userId);

        Map<String, Integer> genreCounts = new HashMap<>();
        Set<String> collectedKeywords = new LinkedHashSet<>();

        for (LibraryEntry entry : library) {
            if (entry.getMovie() != null && entry.getMovie().getGenres() != null) {
                for (String g : entry.getMovie().getGenres()) {
                    genreCounts.put(g, genreCounts.getOrDefault(g, 0) + 1);
                }
            }
            if (entry.getTags() != null) {
                collectedKeywords.addAll(entry.getTags());
            }
        }

        if (genreCounts.isEmpty()) {
            genreCounts.put("Sci-Fi", 5);
            genreCounts.put("Drama", 3);
            genreCounts.put("Thriller", 2);
        }

        if (collectedKeywords.isEmpty()) {
            collectedKeywords.add("Atmospheric");
            collectedKeywords.add("Thought-Provoking");
            collectedKeywords.add("Cinephile Pick");
        }

        return TasteProfileResponse.builder()
                .topGenres(genreCounts)
                .preferredKeywords(new ArrayList<>(collectedKeywords))
                .lastCalculatedAt(java.time.Instant.now())
                .build();
    }

    public Map<String, Object> getFriendTasteMatch(UUID currentUserId, UUID friendId) {
        List<LibraryEntry> myEntries = libraryEntryRepository.findByUserId(currentUserId);
        List<LibraryEntry> friendEntries = libraryEntryRepository.findByUserId(friendId);

        Map<String, Integer> myGenres = extractGenreWeights(myEntries);
        Map<String, Integer> friendGenres = extractGenreWeights(friendEntries);

        // Cosine similarity across genres
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        Set<String> allGenres = new HashSet<>(myGenres.keySet());
        allGenres.addAll(friendGenres.keySet());

        List<String> sharedTopGenres = new ArrayList<>();

        for (String g : allGenres) {
            int a = myGenres.getOrDefault(g, 0);
            int b = friendGenres.getOrDefault(g, 0);
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
            if (a > 0 && b > 0) {
                sharedTopGenres.add(g);
            }
        }

        int matchScore;
        if (normA > 0 && normB > 0) {
            double cosine = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
            matchScore = (int) Math.round(50.0 + (cosine * 46.0)); // scale from 50% to 96%
        } else {
            // Default baseline compatibility for cinephile community
            matchScore = 84 + (Math.abs(currentUserId.hashCode() ^ friendId.hashCode()) % 11);
        }

        if (sharedTopGenres.isEmpty()) {
            sharedTopGenres = List.of("Drama", "Sci-Fi", "Thriller");
        }

        return Map.of(
                "matchPercentage", matchScore,
                "sharedGenres", sharedTopGenres.stream().limit(3).toList(),
                "compatibilityTier", matchScore >= 88 ? "Cinematic Soulmates" : matchScore >= 75 ? "High Synergy" : "Complementary Tastes"
        );
    }

    private Map<String, Integer> extractGenreWeights(List<LibraryEntry> entries) {
        Map<String, Integer> map = new HashMap<>();
        for (LibraryEntry entry : entries) {
            if (entry.getMovie() != null && entry.getMovie().getGenres() != null) {
                int multiplier = entry.isFavorite() ? 3 : (entry.getRating() != null && entry.getRating().doubleValue() >= 8.0) ? 2 : 1;
                for (String g : entry.getMovie().getGenres()) {
                    map.put(g, map.getOrDefault(g, 0) + multiplier);
                }
            }
        }
        return map;
    }
}
