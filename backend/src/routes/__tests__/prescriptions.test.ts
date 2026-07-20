import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import prescriptionsRouter from '../prescriptions.routes';

// Mock Prisma
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    prescription: {
      findMany: vi.fn().mockResolvedValue([
        { token: 'TKN-0001', status: 'Completed', createdAt: new Date() }
      ]),
      create: vi.fn().mockResolvedValue({ token: 'TKN-0002', status: 'Pending' }),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    pharmacySettings: {
      findFirst: vi.fn().mockResolvedValue({ tokenPrefix: 'TKN', lowStockThreshold: 50 }),
    },
    historyLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(),
  }
}));

// Mock authentication middleware to bypass JWT checks for tests
vi.mock('../../middleware/auth.js', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { role: 'Admin', name: 'Test Admin' };
    next();
  },
  requireAdmin: (req: any, res: any, next: any) => next(),
  requireStaff: (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/prescriptions', prescriptionsRouter);

describe('Prescriptions API', () => {
  it('GET /api/prescriptions should return mapped prescriptions', async () => {
    const res = await request(app).get('/api/prescriptions');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body[0].token).toBe('TKN-0001');
  });

  it('POST /api/prescriptions should create a new prescription', async () => {
    const payload = {
      patientName: 'John Test',
      patientNo: 'P-123',
      doctor: 'Dr. Test',
      date: new Date().toISOString(),
      medicines: [], // Empty medicines should pass now since we removed .min(1)
      consultationFee: 1000,
      additionalCharges: [],
      totalAmount: 1000
    };

    const res = await request(app).post('/api/prescriptions').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.token).toBe('TKN-0002');
  });
});
