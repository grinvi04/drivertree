export const RAG_CONFIG = {
  SIMILARITY_THRESHOLD: 0.6,
  CHUNK_SEARCH_LIMIT: 3,
  MAX_CHUNK_SIZE: 500,
  EMBEDDING_MODEL: 'text-embedding-004',
  GENERATION_MODEL: 'gemini-1.5-flash',
} as const;
