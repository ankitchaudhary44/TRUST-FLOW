import { Router } from 'express';
import { investigateAlert } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, requireRole(['ANALYST', 'ADMIN']));

router.post('/investigate/:alertId', investigateAlert);

export default router;
