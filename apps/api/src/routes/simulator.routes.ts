import { Router } from 'express';
import { simulateRisk } from '../controllers/simulator.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, requireRole(['ANALYST', 'ADMIN']));

router.post('/simulate', simulateRisk);

export default router;
