package com.cinemind.repository;

import com.cinemind.domain.entity.MovieRecommendation;
import com.cinemind.domain.enums.RecommendationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MovieRecommendationRepository extends JpaRepository<MovieRecommendation, UUID> {
    List<MovieRecommendation> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
    List<MovieRecommendation> findByRecipientIdAndStatusOrderByCreatedAtDesc(UUID recipientId, RecommendationStatus status);
    List<MovieRecommendation> findBySenderIdOrderByCreatedAtDesc(UUID senderId);
    List<MovieRecommendation> findByRecipientIdAndMovieId(UUID recipientId, UUID movieId);
    long countBySenderId(UUID senderId);
    long countBySenderIdAndStatus(UUID senderId, RecommendationStatus status);
    long countBySenderIdAndIsHelpfulTrue(UUID senderId);
}
