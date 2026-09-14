import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import { evaluateTransactionRisk } from '../services/risk.engine';

export const evaluateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, beneficiaryId, deviceId } = req.body;
    const userId = req.user!.userId;

    // Determine Context
    let isNewBeneficiary = false;
    let isNewDevice = false;

    if (beneficiaryId) {
      const existingTx = await prisma.transaction.findFirst({
        where: { sourceAccount: { userId }, beneficiaryId }
      });
      if (!existingTx) isNewBeneficiary = true;
    }

    if (deviceId) {
      const device = await prisma.device.findFirst({
        where: { id: deviceId, userId }
      });
      if (!device || !device.isTrusted) isNewDevice = true;
    }

    const currentHour = new Date().getHours();

    const riskResult = await evaluateTransactionRisk({
      userId,
      amount: Number(amount),
      beneficiaryId,
      deviceId,
      isNewBeneficiary,
      isNewDevice,
      timeOfDay: currentHour
    });

    res.status(200).json(riskResult);
  } catch (error) {
    console.error('Error evaluating transaction:', error);
    res.status(500).json({ message: 'Error evaluating transaction risk' });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, beneficiaryId, deviceId, riskAssessment } = req.body;
    const userId = req.user!.userId;

    // Get user account
    const account = await prisma.account.findFirst({
      where: { userId }
    });

    if (!account) {
      return res.status(404).json({ message: 'Source account not found' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Handle string inputs for beneficiary that don't exist in DB (for prototype UX)
    let finalBeneficiaryId = beneficiaryId;
    if (beneficiaryId) {
      const existingBen = await prisma.beneficiary.findUnique({ where: { id: beneficiaryId } }).catch(() => null);
      if (!existingBen) {
        // Create dummy beneficiary so foreign key constraint passes
        const newBen = await prisma.beneficiary.create({
          data: {
            userId: account.userId,
            name: `Mock User (${beneficiaryId})`,
            accountNumber: beneficiaryId
          }
        });
        finalBeneficiaryId = newBen.id;
      }
    }

    // Execute in transaction
    // Auto-create Device if it doesn't exist
    if (deviceId) {
      const existingDevice = await prisma.device.findUnique({
        where: { id: deviceId }
      });
      if (!existingDevice) {
        await prisma.device.create({
          data: {
            id: deviceId,
            userId,
            deviceName: 'Unknown Browser',
            ipAddress: '127.0.0.1',
            isTrusted: false,
            lastSeen: new Date()
          }
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct balance
      await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: amount } }
      });

      // 2. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          sourceAccountId: account.id,
          beneficiaryId: finalBeneficiaryId,
          amount,
          status: 'COMPLETED',
          deviceId
        }
      });

      // 3. Save Risk Assessment if provided
      if (riskAssessment) {
        const assessment = await tx.riskAssessment.create({
          data: {
            transactionId: transaction.id,
            riskScore: riskAssessment.riskScore,
            riskLevel: riskAssessment.riskLevel,
            primaryReason: riskAssessment.primaryReason,
          }
        });

        if (riskAssessment.factors && riskAssessment.factors.length > 0) {
          await tx.riskFactor.createMany({
            data: riskAssessment.factors.map((f: any) => ({
              assessmentId: assessment.id,
              factorName: f.name,
              contribution: f.contribution
            }))
          });
        }

        // Generate alert for medium to high risk
        if (riskAssessment.riskScore >= 50) {
          await tx.alert.create({
            data: {
              assessmentId: assessment.id,
              status: 'OPEN'
            }
          });
        }
      }

      return transaction;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Error processing transaction' });
  }
};

export const getUserTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const account = await prisma.account.findFirst({ where: { userId } });
    
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const transactions = await prisma.transaction.findMany({
      where: { sourceAccountId: account.id },
      include: {
        beneficiary: true,
        riskAssessment: {
          include: { factors: true, alert: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};
