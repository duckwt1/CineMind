package com.cinemind.domain.entity;

import com.cinemind.domain.enums.ViewingContext;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "journal_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "library_entry_id", nullable = false, unique = true)
    private LibraryEntry libraryEntry;

    @Column(name = "entry_text", columnDefinition = "TEXT", length = 10000)
    private String entryText;

    @Enumerated(EnumType.STRING)
    @Column(name = "viewing_context", nullable = false)
    @Builder.Default
    private ViewingContext viewingContext = ViewingContext.HOME_SOLO;

    @Column(name = "private_notes", columnDefinition = "TEXT", length = 2000)
    private String privateNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
