package com.cinemind.repository;

import com.cinemind.domain.entity.TasteProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TasteProfileRepository extends JpaRepository<TasteProfile, UUID> {
    Optional<TasteProfile> findByUserId(UUID userId);
}
