package com.cinemind.repository;

import com.cinemind.domain.entity.Friendship;
import com.cinemind.domain.enums.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {
    Optional<Friendship> findByUserIdAndFriendId(UUID userId, UUID friendId);

    @Query("SELECT f FROM Friendship f WHERE (f.user.id = :u1 AND f.friend.id = :u2) OR (f.user.id = :u2 AND f.friend.id = :u1)")
    Optional<Friendship> findBetweenUsers(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @Query("SELECT f FROM Friendship f WHERE (f.user.id = :userId OR f.friend.id = :userId) AND f.status = :status")
    List<Friendship> findAllByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") FriendshipStatus status);

    @Query("SELECT f FROM Friendship f WHERE f.user.id = :userId OR f.friend.id = :userId")
    List<Friendship> findAllByUserId(@Param("userId") UUID userId);

    @Query("SELECT f FROM Friendship f WHERE f.friend.id = :userId AND f.status = 'PENDING'")
    List<Friendship> findIncomingPendingRequests(@Param("userId") UUID userId);

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN TRUE ELSE FALSE END FROM Friendship f " +
           "WHERE ((f.user.id = :u1 AND f.friend.id = :u2) OR (f.user.id = :u2 AND f.friend.id = :u1)) " +
           "AND f.status = 'ACCEPTED'")
    boolean areFriends(@Param("u1") UUID u1, @Param("u2") UUID u2);
}
