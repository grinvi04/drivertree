export const RAG_CONFIG = {
  SIMILARITY_THRESHOLD: 0.6,
  CHUNK_SEARCH_LIMIT: 3,
  MAX_CHUNK_SIZE: 500,
  EMBEDDING_MODEL: 'gemini-embedding-001',
  EMBEDDING_DIMENSION: 768, // DB ContentEmbedding.embedding vector(768)와 일치시킬 것
  GENERATION_MODEL: 'gemini-2.5-flash',
} as const;
