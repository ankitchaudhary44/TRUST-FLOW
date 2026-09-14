import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/db';

export const generateAIInvestigation = async (alertId: string) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  // 1. Gather Structured Evidence
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      assessment: {
        include: {
          factors: true,
          transaction: {
            include: {
              sourceAccount: { include: { user: { include: { customerBaseline: true } } } },
              beneficiary: true,
              device: true
            }
          }
        }
      }
    }
  });

  if (!alert || !alert.assessment) throw new Error('Alert not found');

  const { transaction, riskScore, riskLevel, primaryReason, factors } = alert.assessment;
  const user = transaction.sourceAccount.user;

  // Gather recent security events
  const securityEvents = await prisma.securityEvent.findMany({
    where: { userId: user.id },
    orderBy: { timestamp: 'desc' },
    take: 10
  });

  // 2. Build Structured Prompt
  const structuredEvidence = `
    INVESTIGATION TARGET: Transaction ${transaction.id}
    
    1. CUSTOMER PROFILE:
    - User ID: ${user.id}
    - Current Trust State: ${user.trustState}
    - Median Transaction Amount: ${user.customerBaseline?.medianAmount || 'Unknown'}
    
    2. TRANSACTION DETAILS:
    - Amount: ${transaction.amount}
    - Timestamp: ${transaction.timestamp}
    - Beneficiary: ${transaction.beneficiary?.name || 'Unknown'} (ID: ${transaction.beneficiaryId})
    - Device Used: ${transaction.device?.deviceName || 'Unknown'} (IP: ${transaction.device?.ipAddress || 'Unknown'})
    
    3. RISK ASSESSMENT:
    - Risk Score: ${riskScore}/100
    - Risk Level: ${riskLevel}
    - Primary Reason: ${primaryReason}
    - Contributing Factors:
      ${factors.map(f => `- ${f.factorName} (+${f.contribution})`).join('\n      ')}
      
    4. RECENT SECURITY EVENTS (Timeline):
    ${securityEvents.map(e => `- ${e.timestamp.toISOString()}: ${e.eventType} (Device: ${e.deviceId})`).join('\n    ')}
    
    INSTRUCTIONS:
    You are an expert SOC Analyst AI Assistant (TrustFlow Investigator).
    Using ONLY the structured evidence above, produce a JSON response with the following keys:
    1. "investigation_summary": A concise 2-sentence summary of the event.
    2. "main_risk_indicators": Array of the top 3 most concerning data points.
    3. "timeline_interpretation": How the recent security events relate to this transaction.
    4. "possible_scenario": What kind of fraud/scam this looks like (e.g., Account Takeover, Social Engineering, Normal Behavior).
    5. "recommended_next_step": Specific action for the human analyst to take.
    6. "evidence_supporting_recommendation": Why you recommend that step based on the data.
    7. "confidence_level": High, Medium, or Low.
    
    CRITICAL RULE: DO NOT invent evidence. If information is unavailable, say "Insufficient evidence." Output strictly as valid JSON without markdown wrapping.
  `;

  // 3. Call Gemini
  try {
    const result = await model.generateContent(structuredEvidence);
    const responseText = result.response.text();
    
    // Clean JSON (remove markdown formatting if Gemini adds it despite instructions)
    const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
    
    const parsedResponse = JSON.parse(jsonStr);
    
    // 4. Save the AI Summary to the database
    const investigation = await prisma.investigation.upsert({
      where: { alertId: alert.id },
      update: {
        aiSummary: JSON.stringify(parsedResponse),
        recommendedAction: parsedResponse.recommended_next_step
      },
      create: {
        alertId: alert.id,
        analystId: 'AUTO-AI',
        status: 'UNDER REVIEW',
        aiSummary: JSON.stringify(parsedResponse),
        recommendedAction: parsedResponse.recommended_next_step
      }
    });

    return parsedResponse;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate AI investigation');
  }
};
