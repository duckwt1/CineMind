package com.cinemind.dto;

import com.cinemind.domain.enums.FriendshipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendResponse {
    private UUID id;
    private String username;
    private String avatarUrl;
    private UUID friendshipId;
    private FriendshipStatus status;
    private Instant friendsSince;
    private Boolean isIncoming;
}
