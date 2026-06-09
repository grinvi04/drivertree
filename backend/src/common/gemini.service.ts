import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, EmbedContentRequest } from '@google/generative-ai';
import { RAG_CONFIG } from './constants/rag.config';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI | null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  get isAvailable(): boolean {
    return this.genAI !== null;
  }

  async getEmbedding(text: string): Promise<number[] | null> {
    if (!this.genAI) return null;
    try {
      const model = this.genAI.getGenerativeModel({
        model: RAG_CONFIG.EMBEDDING_MODEL,
      });
      // gemini-embedding-001 기본 차원은 3072 → DB vector(768)에 맞춰 명시.
      // outputDimensionality는 SDK 0.24.1 타입에 누락돼 있으나 API는 지원하므로 교차 타입으로 보강.
      const request: EmbedContentRequest & { outputDimensionality: number } = {
        content: { role: 'user', parts: [{ text }] },
        outputDimensionality: RAG_CONFIG.EMBEDDING_DIMENSION,
      };
      const result = await model.embedContent(request);
      return result.embedding.values;
    } catch (error) {
      this.logger.error(
        'Failed to get embedding',
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.genAI) throw new Error('Gemini API key not configured');
    const model = this.genAI.getGenerativeModel({
      model: RAG_CONFIG.GENERATION_MODEL,
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
