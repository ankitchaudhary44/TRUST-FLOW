'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, XCircle, Wallet, ArrowRightLeft, Clock, Search, Bell, UserCircle } from 'lucide-react';
import RiskFactorChart from '@/components/RiskFactorChart';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

interface RiskFactor {
  name: string;
  contribution: number;
}

interface RiskResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  primaryReason: string;
  factors: RiskFactor[];
}

export default function TransferPage() {
  const [amount, setAmount] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [step, setStep] = useState<'FORM' | 'EVALUATING' | 'INTERVENTION' | 'SUCCESS'>('FORM');
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const router = useRouter();

  const fetchData = async (authToken: string) => {
    try {
      const [balanceRes, historyRes] = await Promise.all([
        fetch('http://localhost:4000/api/customer/balance', { headers: { 'Authorization': `Bearer ${authToken}` } }),
        fetch('http://localhost:4000/api/transactions/history', { headers: { 'Authorization': `Bearer ${authToken}` } })
      ]);
      const balanceData = await balanceRes.json();
      setBalance(balanceData.balance);
      
      if (balanceRes.status === 401 || historyRes.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?role=CUSTOMER';
        return;
      }
      
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!savedToken) {
      router.push('/login?role=CUSTOMER');
      return;
    }
    
    if (role !== 'CUSTOMER') {
      router.push('/analyst');
      return;
    }
    
    setToken(savedToken);
    fetchData(savedToken);
  }, [router]);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('EVALUATING');

    try {
      if (!token) throw new Error('No auth token available.');

      const res = await fetch('http://localhost:4000/api/transactions/evaluate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(amount),
          beneficiaryId: beneficiary,
          deviceId: btoa(navigator.userAgent + screen.width + screen.height).substring(0, 32)
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login?role=CUSTOMER';
          return;
        }
        throw new Error('API Error');
      }

      const data = await res.json();
      
      setTimeout(() => {
        setRiskResult({
          riskScore: data.riskScore,
          riskLevel: data.riskLevel,
          primaryReason: data.primaryReason,
          factors: data.factors || []
        });

        if (data.riskScore >= 61) {
          setStep('INTERVENTION');
        } else {
          executeTransaction(data);
        }
      }, 800);

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Evaluation failed');
      setStep('FORM');
    }
  };

  const executeTransaction = async (riskAssessmentData: RiskResult) => {
    try {
      const res = await fetch('http://localhost:4000/api/transactions/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(amount),
          beneficiaryId: beneficiary,
          deviceId: btoa(navigator.userAgent + screen.width + screen.height).substring(0, 32),
          riskAssessment: riskAssessmentData
        })
      });

      if (res.ok) {
        setStep('SUCCESS');
        if (token) fetchData(token); // Update real-time balance!
      } else {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login?role=CUSTOMER';
          return;
        }
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Transaction failed! An error occurred.");
        setStep('FORM');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Transaction failed');
      setStep('FORM');
    }
  };

  const handleConfirm = () => {
    if (riskResult) {
      executeTransaction(riskResult);
    }
  };

  const handleCancel = () => {
    setStep('FORM');
    setAmount('');
    setBeneficiary('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-black tracking-tight text-blue-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">T</div>
            TrustFlow
          </Link>
          <nav className="hidden md:flex gap-6 ml-4 text-sm font-semibold text-gray-500">
            <a href="#" className="text-blue-600 border-b-2 border-blue-600 pb-1">Dashboard</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Transactions</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Cards</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Investments</a>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <Search className="h-5 w-5 hover:text-gray-900 cursor-pointer transition-colors" />
          <Bell className="h-5 w-5 hover:text-gray-900 cursor-pointer transition-colors" />
          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <UserCircle className="h-8 w-8 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 hidden sm:block mr-2">Ankit C.</span>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                window.location.href = '/login?role=CUSTOMER';
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-7 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Good evening, Ankit</h1>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wallet className="w-32 h-32" />
            </div>
            <p className="text-gray-400 font-medium mb-1">Total Balance</p>
            <h2 className="text-4xl font-black tracking-tight mb-8">₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <div className="flex gap-4">
              <button className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg">Add Money</button>
              <button className="bg-gray-700 bg-opacity-50 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-700 transition-colors backdrop-blur-sm">Statements</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Quick Transfer</h3>
              <button className="text-blue-600 text-sm font-semibold hover:text-blue-800">View All</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {['Rahul M.', 'Priya S.', 'Amazon', 'Airtel'].map((name, i) => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors border border-gray-200">
                    {name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900">{name}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900">New</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-6">
            <h3 className="font-bold text-gray-900 text-lg mb-6">Recent Transactions</h3>
            <div className="space-y-4">
              {history.length > 0 ? history.map((tx, i) => (
                <div key={i} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Transfer to {tx.beneficiary?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">-₹{tx.amount.toLocaleString()}</p>
                    {tx.riskAssessment?.alert && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md uppercase">Under Review</span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500 text-sm">No recent transactions</div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

            {step === 'FORM' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Send Money</h2>
                </div>
                
                <form onSubmit={handleEvaluate} className="space-y-6 flex-1">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">₹</span>
                      <input
                        type="number"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-10 pr-4 text-2xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Beneficiary ID / UPI</label>
                    <input
                      type="text"
                      required
                      value={beneficiary}
                      onChange={(e) => setBeneficiary(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-4 text-lg font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                      placeholder="e.g. rahul@upi (type 'new' to test)"
                    />
                  </div>
                  


                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 mt-8"
                  >
                    Proceed Securely
                  </button>
                </form>
              </div>
            )}

            {step === 'EVALUATING' && (
              <div className="flex flex-col items-center justify-center flex-1 py-20 animate-in fade-in zoom-in duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-white p-4 rounded-full border-2 border-blue-600">
                    <Search className="w-8 h-8 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-8 mb-2">Analyzing Context</h3>
                <p className="text-gray-500 text-center font-medium">Running real-time behavioral and ML risk checks...</p>
              </div>
            )}

            {step === 'INTERVENTION' && riskResult && (
              <div className="flex flex-col flex-1 animate-in slide-in-from-right duration-500">
                <div className="flex items-center gap-3 text-red-600 mb-6">
                  <AlertTriangle className="w-8 h-8" />
                  <h2 className="text-2xl font-bold text-gray-900">Security Intervention</h2>
                </div>
                
                <p className="text-gray-600 font-medium mb-6">
                  This transaction triggered our security models. We paused it to ensure your account is safe.
                </p>

                <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-gray-700">Calculated Risk Score</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${riskResult.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {riskResult.riskLevel}
                      </span>
                      <span className={`text-2xl font-black ${riskResult.riskLevel === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'}`}>
                        {riskResult.riskScore}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Why this was flagged</p>
                    <RiskFactorChart factors={riskResult.factors} />
                  </div>
                  
                  <div className="space-y-3 mt-4 border-t border-gray-200 pt-4">
                    {riskResult.factors.map((factor, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
                        <span className="text-sm font-medium text-gray-700">{factor.name}</span>
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs">+{factor.contribution}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                  <button
                    onClick={handleConfirm}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-colors shadow-lg hover:shadow-gray-900/20"
                  >
                    Yes, authorize this transfer
                  </button>
                  <button
                    onClick={handleCancel}
                    className="w-full bg-white text-gray-600 border border-gray-200 font-bold py-4 rounded-2xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    No, cancel transaction
                  </button>
                </div>
              </div>
            )}

            {step === 'SUCCESS' && (
              <div className="flex flex-col items-center justify-center flex-1 py-12 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <ShieldCheck className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-2">Sent Successfully</h2>
                <p className="text-gray-500 font-medium mb-8">₹{amount} to {beneficiary}</p>
                <button
                  onClick={() => { setAmount(''); setBeneficiary(''); setStep('FORM'); }}
                  className="bg-gray-100 text-gray-900 font-bold px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
