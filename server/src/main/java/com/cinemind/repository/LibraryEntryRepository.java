package com.cinemind.repository;

import com.cinemind.domain.entity.LibraryEntry;
import com.cinemind.domain.enums.LibraryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LibraryEntryRepository extends JpaRepository<LibraryEntry, UUID> {
    Optional<LibraryEntry> findByUserIdAndMovieId(UUID userId, UUID movieId);
    List<LibraryEntry> findByUserId(UUID userId);
    List<LibraryEntry> findByUserIdAndStatus(UUID userId, LibraryStatus status);
    List<LibraryEntry> findByUserIdAndIsFavoriteTrue(UUID userId);
    long countByUserIdAndStatus(UUID userId, LibraryStatus status);
}
