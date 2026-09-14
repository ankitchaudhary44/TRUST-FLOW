import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateAIInvestigation } from '../services/ai.investigator';

export const investigateAlert = async (req: AuthRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    
    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'AI capabilities are currently disabled (API key missing)' });
    }

    const aiReport = await generateAIInvestigation(alertId);
    
    res.status(200).json(aiReport);
  } catch (error: any) {
    console.error('Error in AI investigation:', error);
    res.status(500).json({ message: error.message || 'Error generating AI report' });
  }
};
