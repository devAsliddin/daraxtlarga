-- Yashil Quest - Database Initialization
-- Enable pgvector extension for future AI/embedding features
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- pgvector is optional, skip if not available
-- CREATE EXTENSION IF NOT EXISTS "vector";
