-- ==============================================================================
-- CineMind Seed Additional Movies Migration (V4__seed_more_movies.sql)
-- Seeds iconic films for local development without requiring external TMDB API
-- ==============================================================================

INSERT INTO movie_cache (id, external_id, title, release_year, runtime_minutes, director, synopsis, poster_path, backdrop_path)
VALUES 
    ('87a45612-40e8-469b-98ec-2a31d9600001', 'tmdb-872585', 'Oppenheimer', 2023, 180, 'Christopher Nolan', 'The story of J. Robert Oppenheimer''s role in the development of the atomic bomb during World War II.', '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', '/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg'),
    ('87a45612-40e8-469b-98ec-2a31d9600002', 'tmdb-157336', 'Interstellar', 2014, 169, 'Christopher Nolan', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', '/xJHokMbljvjADYdit5fK5VQsXEG.jpg'),
    ('87a45612-40e8-469b-98ec-2a31d9600003', 'tmdb-496243', 'Parasite', 2019, 132, 'Bong Joon-ho', 'All unemployed, Ki-taek''s family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.', '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', '/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg'),
    ('87a45612-40e8-469b-98ec-2a31d9600004', 'tmdb-129', 'Spirited Away', 2001, 125, 'Hayao Miyazaki', 'A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.', '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', '/bX5tZfqUe0L4Vq99y9vE93jE0M3.jpg'),
    ('87a45612-40e8-469b-98ec-2a31d9600005', 'tmdb-27205', 'Inception', 2010, 148, 'Christopher Nolan', 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life.', '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg')
ON CONFLICT (id) DO NOTHING;

INSERT INTO movie_cache_genres (movie_id, genre) VALUES 
    ('87a45612-40e8-469b-98ec-2a31d9600001', 'Drama'),
    ('87a45612-40e8-469b-98ec-2a31d9600001', 'History'),
    ('87a45612-40e8-469b-98ec-2a31d9600002', 'Sci-Fi'),
    ('87a45612-40e8-469b-98ec-2a31d9600002', 'Adventure'),
    ('87a45612-40e8-469b-98ec-2a31d9600003', 'Thriller'),
    ('87a45612-40e8-469b-98ec-2a31d9600003', 'Drama'),
    ('87a45612-40e8-469b-98ec-2a31d9600004', 'Animation'),
    ('87a45612-40e8-469b-98ec-2a31d9600004', 'Fantasy'),
    ('87a45612-40e8-469b-98ec-2a31d9600005', 'Sci-Fi'),
    ('87a45612-40e8-469b-98ec-2a31d9600005', 'Action'),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Sci-Fi'),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Adventure')
ON CONFLICT DO NOTHING;
