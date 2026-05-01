import request from 'supertest';
import express from 'express';
import restRouter from '../src/routes/rest';

// Create a simple app for testing the router to avoid DB initialization overhead
const testApp = express();
testApp.use(express.json());
testApp.use('/api', restRouter);

// Mock the DB connection to avoid failing tests in CI/CD without real DB credentials
jest.mock('../src/db/db', () => ({
  getConnection: jest.fn().mockResolvedValue({
    request: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({ recordset: [] }),
      input: jest.fn().mockReturnThis()
    }),
    transaction: jest.fn().mockReturnValue({
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      request: jest.fn().mockReturnValue({
        query: jest.fn().mockResolvedValue({ recordset: [] }),
        input: jest.fn().mockReturnThis()
      })
    })
  })
}));

describe('REST API Routes', () => {
  it('GET /api should return the API index message', async () => {
    const response = await request(testApp).get('/api');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'REST API endpoints');
  });

  it('GET /api/crew should return mocked crew members array', async () => {
    const response = await request(testApp).get('/api/crew');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
