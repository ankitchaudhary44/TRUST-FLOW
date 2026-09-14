import { Router } from 'express';
import { getDashboardMetrics, getAlertsQueue, getAlertDetails } from '../controllers/analyst.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate, requireRole(['ANALYST', 'ADMIN']));

router.get('/dashboard', getDashboardMetrics);
router.get('/alerts', getAlertsQueue);
router.get('/alerts/:id', getAlertDetails);

export default router;
