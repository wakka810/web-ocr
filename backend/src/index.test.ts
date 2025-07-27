import request from 'supertest';
import express from 'express';

// Simple test to ensure the test framework is working
describe('Health Check', () => {
  it('should return ok status', async () => {
    const app = express();
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});