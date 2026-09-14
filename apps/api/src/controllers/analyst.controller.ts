import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

export const getDashboardMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const totalTransactions = await prisma.transaction.count();
    const criticalAlerts = await prisma.alert.count({ where: { status: 'OPEN', assessment: { riskLevel: 'CRITICAL' } } });
    const highAlerts = await prisma.alert.count({ where: { status: 'OPEN', assessment: { riskLevel: 'HIGH' } } });
    
    // Average Risk Score of last 100 transactions
    const recentAssessments = await prisma.riskAssessment.findMany({ take: 100, orderBy: { transaction: { timestamp: 'desc' } } });
    const avgRisk = recentAssessments.length > 0 
      ? Math.round(recentAssessments.reduce((acc, curr) => acc + curr.riskScore, 0) / recentAssessments.length)
      : 0;

    res.status(200).json({
      metrics: {
        totalTransactions,
        criticalAlerts,
        highAlerts,
        avgRisk,
        modelStatus: 'v1.0.4-RF (Active)'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching metrics' });
  }
};

export const getAlertsQueue = async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { status: 'OPEN' },
      include: {
        assessment: {
          include: {
            transaction: {
              include: { sourceAccount: { include: { user: true } }, beneficiary: true }
            },
            factors: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts' });
  }
};

export const getAlertDetails = async (req: AuthRequest, res: Response) => {
  try {
    const alertId = req.params.id;
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        assessment: {
          include: {
            transaction: {
              include: { sourceAccount: { include: { user: true } }, beneficiary: true }
            },
            factors: true
          }
        }
      }
    });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alert details' });
  }
};
