import React from 'react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customer Dashboard</h1>
        <p className="text-gray-600">Welcome back. Here is your recent activity.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Balance</h3>
          <p className="text-3xl font-bold text-gray-900">₹1,50,000</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Trust Score</h3>
          <div className="flex items-center">
            <span className="text-3xl font-bold text-green-600">92</span>
            <span className="ml-2 text-sm text-gray-500">/ 100</span>
          </div>
          <p className="text-xs text-green-600 font-medium mt-2">TRUSTED</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Alerts</h3>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
        <div className="text-center text-gray-500 py-8">
          No recent transactions found.
        </div>
      </div>
    </div>
  );
}
