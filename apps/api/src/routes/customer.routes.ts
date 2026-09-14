import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticate, requireRole(['CUSTOMER', 'ANALYST', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: { id: true, email: true, role: true, trustState: true, createdAt: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/balance', authenticate, async (req: AuthRequest, res) => {
  try {
    const account = await prisma.account.findFirst({
      where: { userId: req.user?.userId }
    });
    res.json({ balance: account?.balance || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
