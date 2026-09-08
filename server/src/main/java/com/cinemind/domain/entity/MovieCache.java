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
@Table(name = "movie_cache")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieCache {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "external_id", nullable = false, unique = true, length = 100)
    private String externalId;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(name = "release_year")
    private Integer releaseYear;

    @Column(name = "runtime_minutes")
    private Integer runtimeMinutes;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "movie_cache_genres", joinColumns = @JoinColumn(name = "movie_id"))
    @Column(name = "genre")
    @Builder.Default
    private List<String> genres = new ArrayList<>();

    @Column(length = 255)
    private String director;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "movie_cache_cast", joinColumns = @JoinColumn(name = "movie_id"))
    @Column(name = "cast_member")
    @Builder.Default
    private List<String> castMembers = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String synopsis;

    @Column(name = "poster_path", length = 500)
    private String posterPath;

    @Column(name = "backdrop_path", length = 500)
    private String backdropPath;

    @CreationTimestamp
    @Column(name = "cached_at", nullable = false, updatable = false)
    private Instant cachedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
