package com.cinemind.domain.entity;

import com.cinemind.domain.enums.LibraryStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "library_entries", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "movie_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LibraryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private MovieCache movie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LibraryStatus status = LibraryStatus.WANT_TO_WATCH;

    @Column(precision = 3, scale = 1)
    private BigDecimal rating;

    @Column(name = "is_favorite", nullable = false)
    @Builder.Default
    private boolean isFavorite = false;

    @Column(name = "rewatch_count", nullable = false)
    @Builder.Default
    private int rewatchCount = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "library_entry_tags", joinColumns = @JoinColumn(name = "library_entry_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Column(name = "watched_date")
    private LocalDate watchedDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
