import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
      const result = await model.embedContent(text);
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
