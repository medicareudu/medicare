import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { addHistoryLog, mapHistory } from '../utils/helpers.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const history = await prisma.historyLog.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(history.map(mapHistory));
  })
);

router.delete(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.historyLog.deleteMany();
    await addHistoryLog('Settings', 'HISTORY_RESET', 'System audit logs cleared', req.user!.name);
    res.json({ message: 'History cleared' });
  })
);

export default router;
