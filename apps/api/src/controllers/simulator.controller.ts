import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { evaluateTransactionRisk } from '../services/risk.engine';
import prisma from '../config/db';

export const simulateRisk = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      transactionId, 
      overrideAmount, 
      overrideIsNewBeneficiary, 
      overrideIsNewDevice, 
      overrideTimeOfDay 
    } = req.body;

    // Fetch original transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { sourceAccount: true, device: true, beneficiary: true }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const userId = transaction.sourceAccount.userId;

    // Determine current values if not overridden
    const currentAmount = overrideAmount !== undefined ? Number(overrideAmount) : transaction.amount;
    
    let isNewBeneficiary = false;
    if (overrideIsNewBeneficiary !== undefined) {
      isNewBeneficiary = Boolean(overrideIsNewBeneficiary);
    } else if (transaction.beneficiaryId) {
      // Very basic check for original context (in reality we'd store the original flags or recalculate them)
      isNewBeneficiary = true; // Assume true for demo if not overridden
    }

    let isNewDevice = false;
    if (overrideIsNewDevice !== undefined) {
      isNewDevice = Boolean(overrideIsNewDevice);
    } else if (transaction.deviceId && transaction.device) {
      isNewDevice = !transaction.device.isTrusted;
    }

    const timeOfDay = overrideTimeOfDay !== undefined 
      ? Number(overrideTimeOfDay) 
      : transaction.timestamp.getHours();

    // Call the actual risk engine
    const simulatedRisk = await evaluateTransactionRisk({
      userId,
      amount: currentAmount,
      beneficiaryId: transaction.beneficiaryId || undefined,
      deviceId: transaction.deviceId || undefined,
      isNewBeneficiary,
      isNewDevice,
      timeOfDay
    });

    res.status(200).json({
      simulatedRiskScore: simulatedRisk.riskScore,
      simulatedRiskLevel: simulatedRisk.riskLevel,
      factors: simulatedRisk.factors
    });
  } catch (error) {
    console.error('Error simulating risk:', error);
    res.status(500).json({ message: 'Error running simulation' });
  }
};
