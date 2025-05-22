ALTER SYSTEM SET vectors.pgvector_compatibility=on;

DROP EXTENSION IF EXISTS vectors;
CREATE EXTENSION vectors;

CREATE TABLE IF NOT EXISTS test_table (
    id BIGSERIAL PRIMARY KEY,
    name TEXT,
    embedding VECTOR(3) NOT NULL
);
