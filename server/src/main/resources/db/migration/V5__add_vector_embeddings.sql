-- ==============================================================================
-- CineMind Migration V2: Vector Embeddings for Semantic Movie Search
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column with 768 dimensions (gemini-embedding-001)
ALTER TABLE movie_cache ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create HNSW index for fast cosine distance nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_movie_cache_embedding
ON movie_cache USING hnsw (embedding vector_cosine_ops);
