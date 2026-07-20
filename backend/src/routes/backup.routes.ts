import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateBackupData, scheduleAutoBackups } from '../services/backup.service.js';
import { addHistoryLog } from '../utils/helpers.js';

const router = Router();

router.use(authenticate);

router.get(
  '/download',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const backupData = await generateBackupData(req.user!.name);
    
    await addHistoryLog('Settings', 'BACKUP_DOWNLOAD', 'Manually downloaded full system backup JSON', req.user!.name);
    
    const filename = `Medicare_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    
    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(backupData, null, 2));
  })
);

router.post(
  '/re-schedule',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await scheduleAutoBackups();
    res.json({ message: 'Backup scheduler updated.' });
  })
);

export default router;
