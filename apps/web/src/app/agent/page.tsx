'use client';

import React, { useState } from 'react';
import { Bot, ShieldCheck, ShieldAlert, ShoppingCart, Gem, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function AgenticSecurityPage() {
  const [agents, setAgents] = useState([
    {
      id: 'ag-1122',
      name: 'GroceryBot',
      authorizedCategories: ['GROCERIES', 'ESSENTIALS'],
      allowedMerchants: ['BIGBASKET', 'BLINKIT'],
      maxAmount: 2500,
      isActive: true
    }
  ]);

  const [simulationResult, setSimulationResult] = useState<any>(null);

  const simulateTransaction = (type: 'valid' | 'invalid') => {
    setSimulationResult(null);
    setTimeout(() => {
      if (type === 'valid') {
        setSimulationResult({
          status: 'APPROVED',
          amount: 1500,
          merchant: 'BLINKIT',
          category: 'GROCERIES',
          message: 'Transaction successfully processed by GroceryBot.'
        });
      } else {
        setSimulationResult({
          status: 'BLOCKED',
          amount: 45000,
          merchant: 'MALABAR_GOLD',
          category: 'JEWELRY',
          reason: "Category 'JEWELRY' is explicitly unauthorized for this agent.",
          riskPenalty: 85
        });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm font-medium">Dashboard</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 text-sm font-medium">Agentic Security</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AI Agent Authorizations</h1>
          <p className="text-gray-600 mt-2">Delegate financial tasks to autonomous AI agents safely by setting strict cryptographic boundaries.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agent Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <Bot className="h-8 w-8 text-blue-200" />
                <div>
                  <h2 className="text-xl font-bold">GroceryBot</h2>
                  <p className="text-blue-200 text-sm">Active Autonomous Agent</p>
                </div>
              </div>
              <div className="bg-blue-800 bg-opacity-50 px-3 py-1 rounded-full border border-blue-400 text-xs font-bold tracking-wide">
                ag-1122
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Authorized Categories</label>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">GROCERIES</span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">ESSENTIALS</span>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approved Merchants</label>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200 text-sm font-mono">BIGBASKET</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200 text-sm font-mono">BLINKIT</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Max Transaction Limit</label>
                <p className="text-lg font-bold text-gray-900 mt-1">₹2,500.00</p>
              </div>
            </div>
          </div>

          {/* Transaction Simulator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Live Agent Sandbox</h2>
              <p className="text-gray-600 text-sm mb-6">Test the cryptographic constraints applied to GroceryBot.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => simulateTransaction('valid')}
                  className="w-full bg-gray-50 border border-gray-300 hover:border-gray-400 p-4 rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full"><ShoppingCart className="h-5 w-5 text-green-700" /></div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-sm">GroceryBot buys Groceries</p>
                      <p className="text-xs text-gray-500">₹1,500 at Blinkit</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400">TEST</span>
                </button>

                <button 
                  onClick={() => simulateTransaction('invalid')}
                  className="w-full bg-gray-50 border border-gray-300 hover:border-gray-400 p-4 rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full"><Gem className="h-5 w-5 text-red-700" /></div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-sm">GroceryBot buys Jewelry (Hack)</p>
                      <p className="text-xs text-gray-500">₹45,000 at Malabar Gold</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400">TEST</span>
                </button>
              </div>
            </div>

            {simulationResult && (
              <div className={`mt-6 p-4 rounded-lg border ${simulationResult.status === 'APPROVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} animate-in slide-in-from-bottom-2`}>
                <div className="flex items-start gap-3">
                  {simulationResult.status === 'APPROVED' ? (
                    <ShieldCheck className="h-6 w-6 text-green-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                  )}
                  <div>
                    <h3 className={`font-bold ${simulationResult.status === 'APPROVED' ? 'text-green-900' : 'text-red-900'}`}>
                      {simulationResult.status === 'APPROVED' ? 'Transaction Authorized' : 'TrustFlow Intercept: Agent Blocked'}
                    </h3>
                    <p className={`text-sm mt-1 ${simulationResult.status === 'APPROVED' ? 'text-green-800' : 'text-red-800'}`}>
                      {simulationResult.reason || simulationResult.message}
                    </p>
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
