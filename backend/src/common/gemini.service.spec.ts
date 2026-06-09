import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiService } from './gemini.service';
import { RAG_CONFIG } from './constants/rag.config';

jest.mock('@google/generative-ai');

describe('GeminiService', () => {
  const embedContent = jest.fn();
  const generateContent = jest.fn();
  const getGenerativeModel = jest.fn();
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, GEMINI_API_KEY: 'test-key' };
    getGenerativeModel.mockReturnValue({ embedContent, generateContent });
    (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
      getGenerativeModel,
    }));
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('RAG_CONFIG: 현행 사용 가능한 모델·차원으로 설정되어 있다', () => {
    expect(RAG_CONFIG.GENERATION_MODEL).toBe('gemini-2.5-flash');
    expect(RAG_CONFIG.EMBEDDING_MODEL).toBe('gemini-embedding-001');
    expect(RAG_CONFIG.EMBEDDING_DIMENSION).toBe(768);
  });

  it('getEmbedding: EMBEDDING_MODEL로 outputDimensionality 768을 명시해 호출한다', async () => {
    embedContent.mockResolvedValue({
      embedding: { values: new Array(768).fill(0) as number[] },
    });
    const service = new GeminiService();

    const result = await service.getEmbedding('hello');

    expect(getGenerativeModel).toHaveBeenCalledWith({
      model: RAG_CONFIG.EMBEDDING_MODEL,
    });
    expect(embedContent).toHaveBeenCalledWith(
      expect.objectContaining({ outputDimensionality: 768 }),
    );
    expect(result).toHaveLength(768);
  });

  it('generateContent: GENERATION_MODEL로 호출하고 응답 텍스트를 반환한다', async () => {
    generateContent.mockResolvedValue({ response: { text: () => 'answer' } });
    const service = new GeminiService();

    const result = await service.generateContent('prompt');

    expect(getGenerativeModel).toHaveBeenCalledWith({
      model: RAG_CONFIG.GENERATION_MODEL,
    });
    expect(result).toBe('answer');
  });

  it('API 키가 없으면 getEmbedding은 null, generateContent는 throw 한다', async () => {
    delete process.env.GEMINI_API_KEY;
    const service = new GeminiService();

    await expect(service.getEmbedding('x')).resolves.toBeNull();
    await expect(service.generateContent('x')).rejects.toThrow();
  });
});
