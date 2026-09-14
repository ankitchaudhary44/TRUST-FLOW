'use client';

import React, { useState } from 'react';
import { ArrowLeft, Sparkles, AlertTriangle, User, Target, Activity, Settings2 } from 'lucide-react';
import Link from 'next/link';
import RiskFactorChart from '@/components/RiskFactorChart';

export default function InvestigationPage({ params }: { params: { id: string } }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Simulator State
  const [simAmount, setSimAmount] = useState<string>('85000');
  const [simNewBen, setSimNewBen] = useState<boolean>(true);
  const [simNewDev, setSimNewDev] = useState<boolean>(true);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const [alertData, setAlertData] = useState<any>(null);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/analyst/alerts/${params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login?role=ANALYST';
          return null;
        }
        return res.json();
      })
      .then(data => { if (data) setAlertData(data); })
      .catch(console.error);
  }, [params.id]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/ai/investigate/${params.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login?role=ANALYST';
          return;
        }
        throw new Error(data.message || 'Failed to generate AI report');
      }
      
      setAiReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during AI generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_deviation: Number(simAmount) / 500, // Dummy median 500
          is_new_beneficiary: simNewBen ? 1 : 0,
          is_new_device: simNewDev ? 1 : 0,
          time_of_day: 14
        })
      });
      const data = await res.json();
      setSimResult(data);
    } catch (e) {
      console.error(e);
    }
    setSimulating(false);
  };

  if (!alertData) return <div className="p-8 text-center text-gray-500">Loading alert context...</div>;

  const { assessment } = alertData;
  const { transaction } = assessment;

  return (
    <div className="space-y-6">
      <Link href="/analyst" className="text-gray-500 hover:text-gray-800 flex items-center gap-2 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investigation: {params.id.substring(0, 8)}</h1>
          <p className="text-gray-600">Reviewing flagged transaction context and security timeline.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 bg-white rounded-lg font-medium hover:bg-gray-50">Mark False Positive</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Freeze Account</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context & Simulator */}
        <div className="lg:col-span-1 space-y-6">
          {/* Transaction Details */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Transaction Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Original Amount</span>
                <span className="font-bold text-red-600">₹{transaction.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Beneficiary</span>
                <span className="font-medium text-gray-900">{transaction.beneficiary?.name || transaction.beneficiaryId.substring(0,8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Risk Score</span>
                <span className="font-bold text-red-600">{assessment.riskScore} ({assessment.riskLevel})</span>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <User className="h-5 w-5 text-gray-400" /> Customer Data
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-medium text-gray-900">{transaction.sourceAccount.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trust State</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${assessment.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {assessment.riskLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Graph Intelligence Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <Activity className="h-5 w-5 text-purple-500" /> Relational Graph
            </h3>
            <div className="space-y-4 text-sm">
              <p className="text-gray-600 font-medium">Device Anomaly:</p>
              <div className="bg-purple-50 p-3 rounded text-purple-800 font-medium border border-purple-100">
                ⚠️ Device shared across 3 different accounts (High Risk of ATO)
              </div>
              <p className="text-gray-600 font-medium">Beneficiary Anomaly:</p>
              <div className="bg-purple-50 p-3 rounded text-purple-800 font-medium border border-purple-100">
                ⚠️ Received funds from 4 different users in 7 days (Money Mule Pattern)
              </div>
            </div>
          </div>

          {/* What-If Simulator */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <Settings2 className="h-5 w-5 text-gray-500" /> What-If Simulator
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 font-medium mb-1">Simulate Amount (₹)</label>
                <input 
                  type="number" 
                  value={simAmount} 
                  onChange={e => setSimAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 font-medium">Is New Beneficiary?</label>
                <input type="checkbox" checked={simNewBen} onChange={e => setSimNewBen(e.target.checked)} className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 font-medium">Is Untrusted Device?</label>
                <input type="checkbox" checked={simNewDev} onChange={e => setSimNewDev(e.target.checked)} className="h-4 w-4" />
              </div>
              
              <button 
                onClick={handleSimulate}
                className="w-full bg-gray-900 text-white rounded p-2 text-sm font-medium hover:bg-black transition-colors flex justify-center items-center gap-2"
              >
                {simulating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : 'Run Simulation'}
              </button>

              {simResult && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-in fade-in">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">ML Risk Score</span>
                    <span className={`font-bold ${simResult.ml_risk_score >= 61 ? 'text-red-600' : 'text-green-600'}`}>
                      {simResult.ml_risk_score}/100
                    </span>
                  </div>
                  <RiskFactorChart factors={Object.entries(simResult.feature_contributions || {}).map(([k,v]) => ({name: k, contribution: Number(v)}))} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI & Risk */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 shadow-sm">
            <div className="flex justify-between items-center mb-6 border-b border-indigo-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg"><Sparkles className="h-5 w-5 text-white" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Gemini AI Investigator</h3>
                  <p className="text-xs text-indigo-700">Powered by gemini-1.5-pro</p>
                </div>
              </div>
              {!aiReport && !isGenerating && (
                <button onClick={handleGenerateAI} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                  Generate Investigation
                </button>
              )}
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
                {error}
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-indigo-800 font-medium text-sm">Synthesizing security timeline...</p>
              </div>
            )}

            {aiReport && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                  <p className="text-gray-800 text-sm">{aiReport.investigation_summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                    <h4 className="text-xs font-bold text-indigo-500 mb-2">Probable Scenario</h4>
                    <p className="text-red-700 font-bold">{aiReport.possible_scenario}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm border-l-4 border-l-indigo-500">
                    <h4 className="text-xs font-bold text-indigo-500 mb-2">Recommendation</h4>
                    <p className="text-gray-900 font-semibold text-sm">{aiReport.recommended_next_step}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
