const nock = require('nock');
const hfService = require('../../services/huggingfaceService');

describe('Hugging Face Service', () => {
  const mockImageBuffer = Buffer.from('fake-image-data');
  const mockAudioBuffer = Buffer.from('fake-audio-data');
  const HF_API_BASE = 'https://api-inference.huggingface.co/models';

  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('classifyImage', () => {
    it('should successfully classify an image', async () => {
      const mockResponse = [
        { label: 'Plastic Bottle', score: 0.85 },
        { label: 'Glass', score: 0.10 },
        { label: 'Metal', score: 0.05 },
      ];

      nock(HF_API_BASE)
        .post('/nateraw/food')
        .reply(200, mockResponse);

      const result = await hfService.classifyImage(mockImageBuffer, 'test-request');

      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('raw');
      expect(result.label).toBe('plastic_bottle');
      expect(result.score).toBe(0.85);
      expect(result.raw).toEqual(mockResponse);
    });

    it('should retry on 503 error and succeed', async () => {
      const mockResponse = [{ label: 'Plastic', score: 0.75 }];

      nock(HF_API_BASE)
        .post('/nateraw/food')
        .reply(503, { error: 'Service unavailable' })
        .post('/nateraw/food')
        .reply(200, mockResponse);

      const result = await hfService.classifyImage(mockImageBuffer, 'test-request');

      expect(result.label).toBe('plastic');
      expect(result.score).toBe(0.75);
    });

    it('should throw error after max retries', async () => {
      nock(HF_API_BASE)
        .post('/nateraw/food')
        .times(4)
        .reply(503, { error: 'Service unavailable' });

      await expect(
        hfService.classifyImage(mockImageBuffer, 'test-request')
      ).rejects.toThrow('rate limit exceeded');
    }, 15000);

    it('should handle invalid response format', async () => {
      nock(HF_API_BASE)
        .post('/nateraw/food')
        .reply(200, { invalid: 'format' });

      await expect(
        hfService.classifyImage(mockImageBuffer, 'test-request')
      ).rejects.toThrow('Invalid response format');
    });
  });

  describe('transcribeAudio', () => {
    it('should successfully transcribe audio', async () => {
      const mockResponse = {
        text: 'plastic bottle',
        confidence: 0.92,
      };

      nock(HF_API_BASE)
        .post('/openai/whisper-base')
        .reply(200, mockResponse);

      const result = await hfService.transcribeAudio(mockAudioBuffer, 'test-request');

      expect(result).toHaveProperty('text');
      expect(result.text).toBe('plastic bottle');
      expect(result.confidence).toBe(0.92);
    });

    it('should handle transcription without confidence', async () => {
      const mockResponse = {
        text: 'organic waste',
      };

      nock(HF_API_BASE)
        .post('/openai/whisper-base')
        .reply(200, mockResponse);

      const result = await hfService.transcribeAudio(mockAudioBuffer, 'test-request');

      expect(result.text).toBe('organic waste');
      expect(result.confidence).toBeNull();
    });
  });

  describe('extractWasteKeywords', () => {
    it('should extract relevant keywords from text', () => {
      const text = 'This is a plastic bottle and some paper';
      const keywords = hfService.extractWasteKeywords(text);

      expect(keywords).toContain('plastic');
      expect(keywords).toContain('bottle');
      expect(keywords).toContain('paper');
    });

    it('should return empty array for unrelated text', () => {
      const text = 'Hello world this is a test';
      const keywords = hfService.extractWasteKeywords(text);

      expect(keywords).toEqual([]);
    });
  });

  describe('combineMultimodalPredictions', () => {
    it('should boost confidence when audio confirms image', () => {
      const imageResult = { label: 'plastic', score: 0.7, raw: [] };
      const audioResult = { text: 'plastic bottle', confidence: 0.9 };

      const combined = hfService.combineMultimodalPredictions(imageResult, audioResult);

      expect(combined.label).toBe('plastic');
      expect(combined.confidence).toBeGreaterThan(0.7);
      expect(combined.multimodal).toBe(true);
      expect(combined.audioKeywords).toContain('plastic');
      expect(combined.audioKeywords).toContain('bottle');
    });

    it('should not boost confidence when audio conflicts with image', () => {
      const imageResult = { label: 'plastic', score: 0.7, raw: [] };
      const audioResult = { text: 'organic waste compost', confidence: 0.9 };

      const combined = hfService.combineMultimodalPredictions(imageResult, audioResult);

      expect(combined.label).toBe('plastic');
      expect(combined.confidence).toBeCloseTo(0.7 * 0.8, 2);
    });
  });

  describe('normalizeLabel', () => {
    it('should normalize labels correctly', () => {
      expect(hfService.normalizeLabel('Plastic Bottle')).toBe('plastic_bottle');
      expect(hfService.normalizeLabel('E-Waste')).toBe('e_waste');
      expect(hfService.normalizeLabel('METAL CAN')).toBe('metal_can');
      expect(hfService.normalizeLabel('')).toBe('unknown');
      expect(hfService.normalizeLabel(null)).toBe('unknown');
    });
  });
});
