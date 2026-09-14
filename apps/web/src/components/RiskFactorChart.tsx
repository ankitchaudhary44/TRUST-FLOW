'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RiskFactor {
  name: string;
  contribution: number;
}

interface RiskFactorChartProps {
  factors: RiskFactor[];
}

export default function RiskFactorChart({ factors }: RiskFactorChartProps) {
  // Sort factors by contribution
  const sortedFactors = [...factors].sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="w-full h-64 bg-white p-4 rounded-xl border border-gray-200">
      <h3 className="text-sm font-bold text-gray-700 mb-4">ML SHAP Feature Contributions</h3>
      {factors.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          No significant risk factors detected
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedFactors} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10, fill: '#4B5563' }} />
            <Tooltip
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
              {sortedFactors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name.startsWith('AI:') ? '#8B5CF6' : '#EF4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
