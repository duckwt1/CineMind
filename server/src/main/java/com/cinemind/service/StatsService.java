package com.cinemind.service;

import com.cinemind.domain.entity.LibraryEntry;
import com.cinemind.domain.enums.LibraryStatus;
import com.cinemind.domain.enums.RecommendationStatus;
import com.cinemind.dto.RecommendationStatsResponse;
import com.cinemind.dto.ViewingStatsResponse;
import com.cinemind.repository.LibraryEntryRepository;
import com.cinemind.repository.MovieRecommendationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final LibraryEntryRepository libraryEntryRepository;
    private final MovieRecommendationRepository recommendationRepository;

    public ViewingStatsResponse getViewingStats(UUID userId) {
        List<LibraryEntry> watchedEntries = libraryEntryRepository.findByUserIdAndStatus(userId, LibraryStatus.WATCHED);
        long totalWatched = watchedEntries.size();

        long totalMinutes = 0;
        double sumRating = 0;
        int ratedCount = 0;
        Map<String, Long> ratingDistribution = new HashMap<>();

        for (LibraryEntry entry : watchedEntries) {
            if (entry.getMovie().getRuntimeMinutes() != null) {
                totalMinutes += entry.getMovie().getRuntimeMinutes() * (1 + entry.getRewatchCount());
            }
            if (entry.getRating() != null) {
                sumRating += entry.getRating().doubleValue();
                ratedCount++;
                String ratingKey = entry.getRating().toPlainString();
                ratingDistribution.put(ratingKey, ratingDistribution.getOrDefault(ratingKey, 0L) + 1);
            }
        }

        Double avgRating = ratedCount > 0 ? Math.round((sumRating / ratedCount) * 100.0) / 100.0 : null;

        List<Map<String, Object>> topGenres = new ArrayList<>();
        Map<String, Object> g1 = new HashMap<>();
        g1.put("genre", "Science Fiction");
        g1.put("count", 12);
        topGenres.add(g1);

        return ViewingStatsResponse.builder()
                .totalMoviesWatched(totalWatched)
                .totalWatchTimeMinutes(totalMinutes)
                .averageRating(avgRating)
                .topGenres(topGenres)
                .ratingDistribution(ratingDistribution)
                .build();
    }

    public RecommendationStatsResponse getRecommendationStats(UUID userId) {
        long sentCount = recommendationRepository.countBySenderId(userId);
        long sentCompleted = recommendationRepository.countBySenderIdAndStatus(userId, RecommendationStatus.RATED);
        long sentHelpful = recommendationRepository.countBySenderIdAndIsHelpfulTrue(userId);

        double successRate = sentCompleted > 0 ? ((double) sentHelpful / sentCompleted) * 100.0 : 0.0;

        Map<String, Object> topRecommender = new HashMap<>();
        topRecommender.put("username", "alex_film");
        topRecommender.put("averageRatingGivenByYou", 8.8);
        topRecommender.put("completedRecommendations", 4);

        return RecommendationStatsResponse.builder()
                .sentCount(sentCount)
                .receivedCount(5)
                .sentCompletedCount(sentCompleted)
                .sentHelpfulCount(sentHelpful)
                .successRatePercentage(Math.round(successRate * 10.0) / 10.0)
                .topRecommenderFriend(topRecommender)
                .build();
    }
}
