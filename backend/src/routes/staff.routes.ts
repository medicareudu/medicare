import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { addHistoryLog, mapStaff } from '../utils/helpers.js';

const router = Router();

const staffSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(3).optional(),
  role: z.enum(['Admin', 'Staff']).default('Staff'),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    res.json(users.map(mapStaff));
  })
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = staffSchema.parse(req.body);
    if (!data.password) {
      res.status(400).json({ error: 'Password is required for new staff' });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ staffId: data.id }, { username: data.username }],
      },
    });
    if (existing) {
      res.status(409).json({ error: 'Staff ID or username already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        staffId: data.id,
        name: data.name,
        username: data.username,
        email: data.email || null,
        passwordHash,
        role: data.role,
        status: data.status,
      },
    });

    await addHistoryLog('Staff', data.id, `Added staff member: ${data.name} (${data.role})`, req.user!.name);
    res.status(201).json(mapStaff(user));
  })
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = staffSchema.partial().parse(req.body);
    const existing = await prisma.user.findUnique({ where: { staffId: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.username) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.role) updateData.role = data.role;
    if (data.status) updateData.status = data.status;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.update({
      where: { staffId: req.params.id },
      data: updateData,
    });

    await addHistoryLog('Staff', req.params.id, `Updated staff profile for: ${existing.name}`, req.user!.name);
    res.json(mapStaff(user));
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { staffId: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }

    if (existing.staffId === req.user!.staffId) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    await prisma.user.delete({ where: { staffId: req.params.id } });
    await addHistoryLog('Staff', req.params.id, `Removed staff member: ${existing.name}`, req.user!.name);
    res.json({ message: 'Deleted' });
  })
);

export default router;
