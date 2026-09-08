package com.cinemind.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "taste_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TasteProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "top_genres", columnDefinition = "TEXT")
    @Builder.Default
    private String topGenresJson = "{}";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "taste_profile_keywords", joinColumns = @JoinColumn(name = "taste_profile_id"))
    @Column(name = "keyword")
    @Builder.Default
    private List<String> preferredKeywords = new ArrayList<>();

    @Column(name = "last_calculated_at", nullable = false)
    @Builder.Default
    private Instant lastCalculatedAt = Instant.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
