package com.cinemind.service;

import com.cinemind.common.BadRequestException;
import com.cinemind.common.ForbiddenException;
import com.cinemind.common.ResourceNotFoundException;
import com.cinemind.domain.entity.MovieCache;
import com.cinemind.domain.entity.MovieRecommendation;
import com.cinemind.domain.entity.User;
import com.cinemind.domain.enums.RecommendationStatus;
import com.cinemind.dto.RecommendationFeedbackRequest;
import com.cinemind.dto.RecommendationResponse;
import com.cinemind.dto.SendRecommendationRequest;
import com.cinemind.repository.FriendshipRepository;
import com.cinemind.repository.MovieCacheRepository;
import com.cinemind.repository.MovieRecommendationRepository;
import com.cinemind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final MovieRecommendationRepository recommendationRepository;
    private final UserRepository userRepository;
    private final MovieCacheRepository movieCacheRepository;
    private final FriendshipRepository friendshipRepository;
    private final AuthService authService;
    private final MovieService movieService;

    @Transactional
    public RecommendationResponse sendRecommendation(UUID senderId, SendRecommendationRequest request) {
        if (senderId.equals(request.getRecipientId())) {
            throw new BadRequestException("Cannot recommend a movie to yourself");
        }

        if (!friendshipRepository.areFriends(senderId, request.getRecipientId())) {
            throw new ForbiddenException("Can only send recommendations to confirmed friends");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));
        MovieCache movie = movieCacheRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Movie not found"));

        MovieRecommendation recommendation = MovieRecommendation.builder()
                .sender(sender)
                .recipient(recipient)
                .movie(movie)
                .message(request.getMessage())
                .status(RecommendationStatus.PENDING)
                .build();

        recommendation = recommendationRepository.save(recommendation);
        return mapToResponse(recommendation);
    }

    public List<RecommendationResponse> getInbox(UUID recipientId, RecommendationStatus statusFilter) {
        List<MovieRecommendation> list;
        if (statusFilter != null) {
            list = recommendationRepository.findByRecipientIdAndStatusOrderByCreatedAtDesc(recipientId, statusFilter);
        } else {
            list = recommendationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<RecommendationResponse> getSent(UUID senderId) {
        return recommendationRepository.findBySenderIdOrderByCreatedAtDesc(senderId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public RecommendationResponse updateStatus(UUID recommendationId, UUID userId, RecommendationStatus newStatus) {
        MovieRecommendation rec = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation not found"));

        if (!rec.getRecipient().getId().equals(userId)) {
            throw new ForbiddenException("Only the recipient can update the recommendation status");
        }

        rec.setStatus(newStatus);
        rec = recommendationRepository.save(rec);
        return mapToResponse(rec);
    }

    @Transactional
    public RecommendationResponse submitFeedback(UUID recommendationId, UUID userId, RecommendationFeedbackRequest request) {
        MovieRecommendation rec = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation not found"));

        if (!rec.getRecipient().getId().equals(userId)) {
            throw new ForbiddenException("Only the recipient can provide recommendation feedback");
        }

        rec.setIsHelpful(request.getIsHelpful());
        if (request.getRecipientRating() != null) {
            rec.setRecipientRating(request.getRecipientRating());
        }
        rec.setStatus(RecommendationStatus.RATED);
        rec = recommendationRepository.save(rec);
        return mapToResponse(rec);
    }

    public RecommendationResponse mapToResponse(MovieRecommendation rec) {
        return RecommendationResponse.builder()
                .id(rec.getId())
                .sender(authService.mapToDto(rec.getSender()))
                .recipient(rec.getRecipient() != null ? authService.mapToDto(rec.getRecipient()) : null)
                .movie(movieService.mapToDto(rec.getMovie()))
                .message(rec.getMessage())
                .status(rec.getStatus())
                .isHelpful(rec.getIsHelpful())
                .recipientRating(rec.getRecipientRating())
                .createdAt(rec.getCreatedAt())
                .build();
    }
}
