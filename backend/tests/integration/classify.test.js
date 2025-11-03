const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const app = require('../../server');
const db = require('../../db/database');
const hfService = require('../../services/huggingfaceService');

// Mock Hugging Face service
jest.mock('../../services/huggingfaceService');

describe('Classification API Integration Tests', () => {
  const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');

  beforeAll(async () => {
    // Run migrations and seed database
    await db.runMigrations();
    
    // Seed test city
    await db.db('cities').insert([
      { code: 'TEST', name: 'TestCity' },
    ]);

    const testCity = await db.getCityByCode('TEST');
    
    // Seed test taxonomy mapping
    await db.db('taxonomy_mappings').insert([
      {
        city_id: testCity.id,
        model_label: 'plastic',
        canonical_label: 'Plastic',
        action_text: 'Rinse and Recycle – Blue Bin',
      },
    ]);

    // Create test image fixture if it doesn't exist
    try {
      await fs.access(testImagePath);
    } catch {
      const fixturesDir = path.join(__dirname, '../fixtures');
      await fs.mkdir(fixturesDir, { recursive: true });
      
      // Create a minimal valid JPEG file (1x1 pixel red)
      const minimalJpeg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c,
        0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d,
        0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
        0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
        0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
        0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34,
        0x32, 0xff, 0xd9,
      ]);
      await fs.writeFile(testImagePath, minimalJpeg);
    }
  });

  afterAll(async () => {
    await db.closeConnection();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /classify', () => {
    it('should classify an image successfully', async () => {
      // Mock Hugging Face response
      hfService.classifyImage.mockResolvedValue({
        label: 'plastic',
        score: 0.85,
        raw: [
          { label: 'Plastic', score: 0.85 },
          { label: 'Glass', score: 0.10 },
        ],
      });

      const response = await request(app)
        .post('/classify')
        .field('city', 'TestCity')
        .attach('image', testImagePath)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('predictionId');
      expect(response.body.data).toHaveProperty('label', 'Plastic');
      expect(response.body.data).toHaveProperty('confidence', 0.85);
      expect(response.body.data).toHaveProperty('action', 'Rinse and Recycle – Blue Bin');
      expect(response.body.data).toHaveProperty('city', 'TestCity');
    });

    it('should return 400 when image is missing', async () => {
      const response = await request(app)
        .post('/classify')
        .field('city', 'TestCity')
        .expect(400);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toContain('Image file is required');
    });

    it('should return 422 when city is invalid', async () => {
      const response = await request(app)
        .post('/classify')
        .field('city', 'InvalidCity')
        .attach('image', testImagePath)
        .expect(422);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toContain('Invalid city');
    });

    it('should return 422 when city is missing', async () => {
      const response = await request(app)
        .post('/classify')
        .attach('image', testImagePath)
        .expect(422);

      expect(response.body).toHaveProperty('error', true);
    });

    it('should handle multimodal classification with audio', async () => {
      hfService.classifyImage.mockResolvedValue({
        label: 'plastic',
        score: 0.75,
        raw: [{ label: 'Plastic', score: 0.75 }],
      });

      hfService.transcribeAudio.mockResolvedValue({
        text: 'plastic bottle',
        confidence: 0.9,
      });

      hfService.combineMultimodalPredictions.mockReturnValue({
        label: 'plastic',
        confidence: 0.82,
        multimodal: true,
        audioKeywords: ['plastic', 'bottle'],
        audioText: 'plastic bottle',
      });

      // Create a minimal WAV file for testing
      const minimalWav = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
        0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20,
      ]);
      const audioPath = path.join(__dirname, '../fixtures/test-audio.wav');
      await fs.writeFile(audioPath, minimalWav);

      const response = await request(app)
        .post('/classify')
        .field('city', 'TestCity')
        .attach('image', testImagePath)
        .attach('audio', audioPath)
        .expect(200);

      expect(response.body.data).toHaveProperty('multimodal', true);
      expect(response.body.data).toHaveProperty('audio');
      expect(response.body.data.audio).toHaveProperty('transcription', 'plastic bottle');
    });
  });
});
