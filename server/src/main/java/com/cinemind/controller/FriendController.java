package com.cinemind.controller;

import com.cinemind.common.ApiResponse;
import com.cinemind.dto.FriendRequest;
import com.cinemind.dto.FriendResponse;
import com.cinemind.dto.UserDto;
import com.cinemind.security.UserPrincipal;
import com.cinemind.service.FriendService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FriendResponse>>> listFriends(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<FriendResponse> friends = friendService.listFriends(principal.getId());
        return ResponseEntity.ok(ApiResponse.of(friends));
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<ApiResponse<List<FriendResponse>>> getPendingRequests(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<FriendResponse> list = friendService.getPendingRequests(principal.getId());
        return ResponseEntity.ok(ApiResponse.of(list));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserDto>>> searchUsers(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("q") String query
    ) {
        List<UserDto> users = friendService.searchUsers(query, principal.getId());
        return ResponseEntity.ok(ApiResponse.of(users));
    }

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<Map<String, String>>> sendFriendRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody FriendRequest request
    ) {
        friendService.sendFriendRequest(principal.getId(), request.getRecipientId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(Map.of("message", "Friend request sent successfully")));
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<ApiResponse<Map<String, String>>> acceptRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID friendshipId
    ) {
        friendService.acceptRequest(friendshipId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of(Map.of("message", "Friend request accepted")));
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<ApiResponse<Map<String, String>>> rejectRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID friendshipId
    ) {
        friendService.rejectRequest(friendshipId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of(Map.of("message", "Friend request rejected")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFriend(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable("id") UUID friendshipId
    ) {
        friendService.removeFriend(friendshipId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
