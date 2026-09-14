import { Router } from 'express';
import { evaluateTransaction, createTransaction, getUserTransactions } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/evaluate', evaluateTransaction);
router.post('/create', createTransaction);
router.get('/history', getUserTransactions);
router.get('/', getUserTransactions);

export default router;
