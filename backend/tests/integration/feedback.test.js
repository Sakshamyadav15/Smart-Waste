const request = require('supertest');
const app = require('../../server');
const db = require('../../db/database');

describe('Feedback API Integration Tests', () => {
  let testPredictionId;

  beforeAll(async () => {
    await db.runMigrations();
    
    // Create test city and prediction
    const testCity = await db.getCityByName('TestCity') || 
      await db.db('cities').insert({ code: 'TEST', name: 'TestCity' }).then(() => 
        db.getCityByName('TestCity')
      );

    testPredictionId = await db.insertPrediction({
      cityId: testCity.id,
      userId: 'test-user',
      imagePath: 'test/image.jpg',
      predictedLabel: 'plastic',
      confidence: 0.85,
      rawModelResponse: { test: true },
    });
  });

  afterAll(async () => {
    await db.closeConnection();
  });

  describe('POST /feedback', () => {
    it('should submit feedback successfully', async () => {
      const feedbackData = {
        predictionId: testPredictionId,
        originalLabel: 'plastic',
        correctLabel: 'film',
        city: 'TestCity',
        notes: 'This is actually a plastic wrapper',
        userEmail: 'test@example.com',
      };

      const response = await request(app)
        .post('/feedback')
        .send(feedbackData)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('feedbackId');
      expect(response.body.data).toHaveProperty('predictionId', testPredictionId);
    });

    it('should submit feedback without prediction ID', async () => {
      const feedbackData = {
        originalLabel: 'glass',
        correctLabel: 'plastic',
        city: 'TestCity',
        notes: 'Misclassified',
      };

      const response = await request(app)
        .post('/feedback')
        .send(feedbackData)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body.data.predictionId).toBeNull();
    });

    it('should return 422 when required fields are missing', async () => {
      const response = await request(app)
        .post('/feedback')
        .send({ originalLabel: 'plastic' })
        .expect(422);

      expect(response.body).toHaveProperty('error', true);
    });

    it('should return 404 when prediction ID does not exist', async () => {
      const feedbackData = {
        predictionId: 99999,
        originalLabel: 'plastic',
        correctLabel: 'film',
        city: 'TestCity',
      };

      const response = await request(app)
        .post('/feedback')
        .send(feedbackData)
        .expect(404);

      expect(response.body.message).toContain('Prediction not found');
    });
  });

  describe('GET /feedback', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)
        .get('/feedback')
        .expect(401);

      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return feedback list with valid admin key', async () => {
      const response = await request(app)
        .get('/feedback')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter feedback by city', async () => {
      const response = await request(app)
        .get('/feedback?city=TestCity')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      expect(response.body.status).toBe('ok');
      response.body.data.forEach((feedback) => {
        expect(feedback.city.toLowerCase()).toBe('testcity');
      });
    });

    it('should filter feedback by resolved status', async () => {
      const response = await request(app)
        .get('/feedback?resolved=false')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      expect(response.body.status).toBe('ok');
      response.body.data.forEach((feedback) => {
        expect(feedback.resolved).toBe(false);
      });
    });
  });

  describe('PATCH /feedback/:id/resolve', () => {
    let feedbackId;

    beforeEach(async () => {
      feedbackId = await db.insertFeedback({
        originalLabel: 'plastic',
        correctLabel: 'film',
        city: 'TestCity',
      });
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .patch(`/feedback/${feedbackId}/resolve`)
        .send({ resolved: true })
        .expect(401);

      expect(response.body).toHaveProperty('error', true);
    });

    it('should mark feedback as resolved', async () => {
      const response = await request(app)
        .patch(`/feedback/${feedbackId}/resolve`)
        .set('x-admin-key', 'test-admin-key')
        .send({ resolved: true })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('resolved', true);

      // Verify in database
      const feedback = await db.getFeedbackById(feedbackId);
      expect(feedback.resolved).toBe(true);
    });

    it('should return 404 for non-existent feedback', async () => {
      const response = await request(app)
        .patch('/feedback/99999/resolve')
        .set('x-admin-key', 'test-admin-key')
        .send({ resolved: true })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /feedback/stats', () => {
    it('should return feedback statistics', async () => {
      const response = await request(app)
        .get('/feedback/stats')
        .set('x-admin-key', 'test-admin-key')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('resolved');
      expect(response.body.data).toHaveProperty('unresolved');
      expect(response.body.data).toHaveProperty('byCity');
      expect(response.body.data).toHaveProperty('topIncorrectLabels');
    });
  });
});
