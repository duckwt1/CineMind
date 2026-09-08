package com.cinemind.service;

import com.cinemind.common.BadRequestException;
import com.cinemind.common.ConflictException;
import com.cinemind.common.ResourceNotFoundException;
import com.cinemind.domain.entity.Friendship;
import com.cinemind.domain.entity.User;
import com.cinemind.domain.enums.FriendshipStatus;
import com.cinemind.dto.FriendResponse;
import com.cinemind.dto.UserDto;
import com.cinemind.repository.FriendshipRepository;
import com.cinemind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public List<FriendResponse> listFriends(UUID userId) {
        List<Friendship> friendships = friendshipRepository.findAllByUserId(userId);

        return friendships.stream().map(f -> {
            boolean isCurrentUserSender = f.getUser().getId().equals(userId);
            User otherUser = isCurrentUserSender ? f.getFriend() : f.getUser();
            Boolean isIncoming = null;
            if (f.getStatus() == FriendshipStatus.PENDING) {
                isIncoming = !isCurrentUserSender;
            }

            return FriendResponse.builder()
                    .id(otherUser.getId())
                    .username(otherUser.getUsername())
                    .avatarUrl(otherUser.getAvatarUrl())
                    .friendshipId(f.getId())
                    .status(f.getStatus())
                    .friendsSince(f.getCreatedAt())
                    .isIncoming(isIncoming)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<FriendResponse> getPendingRequests(UUID userId) {
        List<Friendship> incoming = friendshipRepository.findIncomingPendingRequests(userId);

        return incoming.stream().map(f -> {
            User sender = f.getUser();
            return FriendResponse.builder()
                    .id(sender.getId())
                    .username(sender.getUsername())
                    .avatarUrl(sender.getAvatarUrl())
                    .friendshipId(f.getId())
                    .status(FriendshipStatus.PENDING)
                    .friendsSince(f.getCreatedAt())
                    .isIncoming(true)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<UserDto> searchUsers(String query, UUID currentUserId) {
        return userRepository.findByUsernameContainingIgnoreCase(query).stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .map(authService::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void sendFriendRequest(UUID senderId, UUID recipientId) {
        if (senderId.equals(recipientId)) {
            throw new BadRequestException("Cannot friend yourself");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender user not found"));
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient user not found"));

        var existing = friendshipRepository.findBetweenUsers(senderId, recipientId);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new ConflictException("Đã là bạn bè của nhau");
            }
            if (f.getStatus() == FriendshipStatus.PENDING) {
                if (f.getUser().getId().equals(senderId)) {
                    throw new ConflictException("Lời mời kết bạn đã được gửi trước đó");
                } else {
                    f.setStatus(FriendshipStatus.ACCEPTED);
                    friendshipRepository.save(f);
                    return;
                }
            }
        }

        Friendship friendship = Friendship.builder()
                .user(sender)
                .friend(recipient)
                .status(FriendshipStatus.PENDING)
                .build();

        friendshipRepository.save(friendship);
    }

    @Transactional
    public void acceptRequest(UUID friendshipId, UUID userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship request not found"));

        if (!friendship.getFriend().getId().equals(userId)) {
            throw new BadRequestException("Only recipient can accept friend request");
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendshipRepository.save(friendship);
    }

    @Transactional
    public void rejectRequest(UUID friendshipId, UUID userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Friendship request not found"));

        if (!friendship.getFriend().getId().equals(userId) && !friendship.getUser().getId().equals(userId)) {
            throw new BadRequestException("Not authorized to reject or cancel this request");
        }

        friendshipRepository.delete(friendship);
    }

    @Transactional
    public void removeFriend(UUID friendshipId, UUID userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new ResourceNotFoundException("Friend connection not found"));

        if (!friendship.getFriend().getId().equals(userId) && !friendship.getUser().getId().equals(userId)) {
            throw new BadRequestException("Not authorized to remove this friend connection");
        }

        friendshipRepository.delete(friendship);
    }
}
