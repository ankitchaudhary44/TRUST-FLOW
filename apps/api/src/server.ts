import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import transactionRoutes from './routes/transaction.routes';
import securityRoutes from './routes/security.routes';
import analystRoutes from './routes/analyst.routes';
import aiRoutes from './routes/ai.routes';
import simulatorRoutes from './routes/simulator.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/analyst', analystRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/risk', simulatorRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'TrustFlow API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
