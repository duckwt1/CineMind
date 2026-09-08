-- ============================================================
-- V3: Add missing JPA ElementCollection tables
-- ============================================================

CREATE TABLE IF NOT EXISTS library_entry_tags (
    library_entry_id UUID NOT NULL REFERENCES library_entries(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (library_entry_id, tag)
);

CREATE TABLE IF NOT EXISTS movie_cache_genres (
    movie_id UUID NOT NULL REFERENCES movie_cache(id) ON DELETE CASCADE,
    genre VARCHAR(100) NOT NULL,
    PRIMARY KEY (movie_id, genre)
);

CREATE TABLE IF NOT EXISTS movie_cache_cast (
    movie_id UUID NOT NULL REFERENCES movie_cache(id) ON DELETE CASCADE,
    cast_member VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_movie_cache_cast_movie ON movie_cache_cast(movie_id);

CREATE TABLE IF NOT EXISTS taste_profile_keywords (
    taste_profile_id UUID NOT NULL REFERENCES taste_profiles(id) ON DELETE CASCADE,
    keyword VARCHAR(100) NOT NULL,
    PRIMARY KEY (taste_profile_id, keyword)
);
