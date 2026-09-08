package com.cinemind.repository;

import com.cinemind.domain.entity.MovieCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MovieCacheRepository extends JpaRepository<MovieCache, UUID> {
    Optional<MovieCache> findByExternalId(String externalId);
    List<MovieCache> findByTitleContainingIgnoreCase(String title);

    @Query(value = """
            SELECT m.*, (1 - (m.embedding <=> CAST(:embeddingStr AS vector))) as score
            FROM movie_cache m
            WHERE m.embedding IS NOT NULL
              AND (1 - (m.embedding <=> CAST(:embeddingStr AS vector))) >= :minSimilarity
            ORDER BY m.embedding <=> CAST(:embeddingStr AS vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<MovieCache> findNearestByEmbedding(
            @Param("embeddingStr") String embeddingStr,
            @Param("minSimilarity") double minSimilarity,
            @Param("limit") int limit
    );

    @Modifying
    @Query(value = "UPDATE movie_cache SET embedding = CAST(:embeddingStr AS vector) WHERE id = :id", nativeQuery = true)
    void updateEmbedding(
            @Param("id") UUID id,
            @Param("embeddingStr") String embeddingStr
    );

    @Query(value = "SELECT * FROM movie_cache WHERE embedding IS NULL LIMIT :limit", nativeQuery = true)
    List<MovieCache> findMoviesWithoutEmbedding(@Param("limit") int limit);
}
