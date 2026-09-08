-- ==============================================================================
-- CineMind Initial Schema Migration (V1__initial_schema.sql)
-- Target: PostgreSQL 16+ with pgcrypto & vector support
-- ==============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
    CREATE TYPE library_status AS ENUM ('WANT_TO_WATCH', 'WATCHING', 'WATCHED', 'DROPPED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE viewing_context AS ENUM ('THEATER', 'HOME_SOLO', 'HOME_GROUP', 'AIRPLANE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE friendship_status AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recommendation_status AS ENUM ('PENDING', 'SEEN', 'ADDED_TO_WATCHLIST', 'WATCHED', 'RATED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    username VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(1024),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT chk_username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
    CONSTRAINT chk_username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- 2. Table: movie_cache
CREATE TABLE IF NOT EXISTS movie_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    release_year INTEGER,
    runtime_minutes INTEGER,
    genres TEXT[] NOT NULL DEFAULT '{}',
    director VARCHAR(255),
    cast_members TEXT[] NOT NULL DEFAULT '{}',
    synopsis TEXT,
    poster_path VARCHAR(500),
    backdrop_path VARCHAR(500),
    cached_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_movie_cache_external_id UNIQUE (external_id),
    CONSTRAINT chk_runtime_positive CHECK (runtime_minutes IS NULL OR runtime_minutes > 0)
);

-- 3. Table: library_entries
CREATE TABLE IF NOT EXISTS library_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id UUID NOT NULL REFERENCES movie_cache(id) ON DELETE RESTRICT,
    status library_status NOT NULL DEFAULT 'WANT_TO_WATCH',
    rating NUMERIC(3, 1),
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    rewatch_count INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] NOT NULL DEFAULT '{}',
    watched_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_movie UNIQUE (user_id, movie_id),
    CONSTRAINT chk_rewatch_non_negative CHECK (rewatch_count >= 0),
    CONSTRAINT chk_rating_scale CHECK (
        rating IS NULL OR (
            rating >= 1.0 AND rating <= 10.0 AND (rating * 2) = FLOOR(rating * 2)
        )
    )
);

-- 4. Table: journal_entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_entry_id UUID NOT NULL REFERENCES library_entries(id) ON DELETE CASCADE,
    entry_text TEXT,
    viewing_context viewing_context NOT NULL DEFAULT 'HOME_SOLO',
    private_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_journal_library_entry UNIQUE (library_entry_id),
    CONSTRAINT chk_entry_text_length CHECK (entry_text IS NULL OR char_length(entry_text) <= 10000),
    CONSTRAINT chk_private_notes_length CHECK (private_notes IS NULL OR char_length(private_notes) <= 2000)
);

-- 5. Table: friendships
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friendship_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_friendship_pair UNIQUE (user_id, friend_id),
    CONSTRAINT chk_cannot_friend_self CHECK (user_id <> friend_id)
);

-- 6. Table: movie_recommendations
CREATE TABLE IF NOT EXISTS movie_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id UUID NOT NULL REFERENCES movie_cache(id) ON DELETE RESTRICT,
    message VARCHAR(500),
    status recommendation_status NOT NULL DEFAULT 'PENDING',
    is_helpful BOOLEAN,
    recipient_rating NUMERIC(3, 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_cannot_recommend_self CHECK (sender_id <> recipient_id),
    CONSTRAINT chk_recipient_rating CHECK (
        recipient_rating IS NULL OR (
            recipient_rating >= 1.0 AND recipient_rating <= 10.0 AND (recipient_rating * 2) = FLOOR(recipient_rating * 2)
        )
    )
);

-- 7. Table: taste_profiles
CREATE TABLE IF NOT EXISTS taste_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    top_genres JSONB NOT NULL DEFAULT '{}'::jsonb,
    preferred_keywords TEXT[] NOT NULL DEFAULT '{}',
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_taste_profile_user UNIQUE (user_id)
);

-- 8. Table: pre_watch_cache
CREATE TABLE IF NOT EXISTS pre_watch_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES movie_cache(id) ON DELETE CASCADE,
    is_spoiler_free BOOLEAN NOT NULL DEFAULT TRUE,
    analysis_json JSONB NOT NULL,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_movie_spoiler_analysis UNIQUE (movie_id, is_spoiler_free)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_movie_cache_external ON movie_cache (external_id);
CREATE INDEX IF NOT EXISTS idx_library_entries_user_status ON library_entries (user_id, status);
CREATE INDEX IF NOT EXISTS idx_library_entries_user_fav ON library_entries (user_id) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_library_entries_movie ON library_entries (movie_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships (user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON friendships (friend_id, status);
CREATE INDEX IF NOT EXISTS idx_recommendations_inbox ON movie_recommendations (recipient_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_sent ON movie_recommendations (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_movie ON movie_recommendations (movie_id);
