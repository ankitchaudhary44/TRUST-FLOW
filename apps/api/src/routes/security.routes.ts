import { Router } from 'express';
import { triggerEvent, getSecurityTimeline } from '../controllers/security.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/event', triggerEvent);
router.get('/timeline', getSecurityTimeline);

export default router;
