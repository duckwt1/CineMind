-- ==============================================================================
-- CineMind Seed Data Migration (V2__seed_data.sql)
-- Default test accounts: ethan_cine & alex_film (Password: Password123!)
-- Password hash generated with BCrypt ($2a$10$7rD74/N8/vJ0c5pZ4m1aOe0H5tXm2XbT4h0Y5F1j4b5k9a0b1c2d3)
-- ==============================================================================

-- Test users
INSERT INTO users (id, email, username, password_hash, avatar_url)
VALUES 
    ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'ethan@cinemind.app', 'ethan_cine', '$2a$10$w8m8zDk5bT9U0C4jN7.yauYQc9Jz0Q5q7jZ4m1aOe0H5tXm2XbT4h', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'),
    ('c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', 'alex@cinemind.app', 'alex_film', '$2a$10$w8m8zDk5bT9U0C4jN7.yauYQc9Jz0Q5q7jZ4m1aOe0H5tXm2XbT4h', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200')
ON CONFLICT (username) DO NOTHING;

-- Mutual friendship
INSERT INTO friendships (id, user_id, friend_id, status)
VALUES 
    ('33445566-7788-9900-aabb-ccddeeff0011', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', 'ACCEPTED')
ON CONFLICT DO NOTHING;

-- Sample Movie: Dune Part Two
INSERT INTO movie_cache (id, external_id, title, release_year, runtime_minutes, genres, director, cast_members, synopsis, poster_path, backdrop_path)
VALUES 
    (
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'tmdb-693134',
        'Dune: Part Two',
        2024,
        166,
        ARRAY['Science Fiction', 'Adventure'],
        'Denis Villeneuve',
        ARRAY['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        '/8b8RnxnyHu9vhghb4928X0FTbh4.jpg',
        '/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg'
    )
ON CONFLICT (external_id) DO NOTHING;

-- Initial Taste Profile for Ethan
INSERT INTO taste_profiles (id, user_id, top_genres, preferred_keywords)
VALUES 
    (
        '8899aabb-ccdd-eeff-0011-223344556677',
        'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        '{"Science Fiction": 12, "Drama": 8, "Thriller": 6}'::jsonb,
        ARRAY['cerebral', 'atmospheric', 'slow-burn']
    )
ON CONFLICT (user_id) DO NOTHING;
