'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldAlert, Target, Zap, ChevronRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Mock Data for Phase 6 Prototyping
const trendData = [
  { time: '08:00', riskLevel: 32 },
  { time: '09:00', riskLevel: 35 },
  { time: '10:00', riskLevel: 45 },
  { time: '11:00', riskLevel: 88 },
  { time: '12:00', riskLevel: 42 },
  { time: '13:00', riskLevel: 38 },
];

const riskDistribution = [
  { name: 'Low', value: 850, color: '#10B981' },
  { name: 'Medium', value: 120, color: '#F59E0B' },
  { name: 'High', value: 25, color: '#EF4444' },
  { name: 'Critical', value: 5, color: '#991B1B' },
];

export default function AnalystDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/login?role=ANALYST');
      return;
    }
    
    if (role === 'CUSTOMER') {
      router.push('/transfer');
      return;
    }

    const fetchAlertsAndMetrics = async () => {
      try {
        const [alertsRes, metricsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/analyst/alerts`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/analyst/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (alertsRes.status === 401 || metricsRes.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          window.location.href = '/login?role=ANALYST';
          return;
        }
        
        const [alertsData, metricsData] = await Promise.all([alertsRes.json(), metricsRes.json()]);
        
        if (alertsRes.ok) {
          const formattedAlerts = alertsData.map((alert: any) => ({
            id: alert.id,
            transactionId: alert.assessment.transaction.id,
            customer: alert.assessment.transaction.sourceAccount.user.email,
            amount: '₹' + alert.assessment.transaction.amount,
            riskScore: alert.assessment.riskScore,
            riskLevel: alert.assessment.riskLevel,
            reason: alert.assessment.primaryReason,
            timestamp: alert.createdAt
          }));
          setAlerts(formattedAlerts);
        }

        if (metricsRes.ok) {
          setMetrics(metricsData.metrics);
        }
      } catch (e) {
        console.error('Failed to fetch data', e);
      }
    };
    fetchAlertsAndMetrics();
    
    // Poll for new data every 10 seconds
    const interval = setInterval(fetchAlertsAndMetrics, 10000);
    return () => clearInterval(interval);

  }, [router]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Transactions" value={metrics?.totalTransactions || 0} subtext="Lifetime processed" icon={<Activity className="text-blue-500" />} />
        <MetricCard title="Critical Alerts" value={metrics?.criticalAlerts || 0} subtext="Requires immediate triage" highlight="text-red-700" icon={<ShieldAlert className="text-red-600" />} bg="bg-red-50" border="border-red-100" />
        <MetricCard title="High Risk Alerts" value={metrics?.highAlerts || 0} subtext="Auto-blocked by rules" highlight="text-orange-600" icon={<Target className="text-orange-500" />} />
        <MetricCard title="Avg Risk Score" value={metrics?.avgRisk || 0} subtext="Last 100 transactions" highlight="text-emerald-600" icon={<Zap className="text-emerald-500" />} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Activity className="w-48 h-48" />
          </div>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-wide">Average Risk Score Trend</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">Aggregated scoring across all subsystems</p>
            </div>
            <select className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 rounded-md px-2 py-1 outline-none">
              <option>Last 6 Hours</option>
              <option>Last 24 Hours</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderRadius: '8px', color: '#111827', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#2563EB' }}
                />
                <Line type="monotone" dataKey="riskLevel" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#ffffff', stroke: '#2563EB', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#2563EB', stroke: 'none' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div>
            <h3 className="text-sm font-bold text-gray-900 tracking-wide">Risk Distribution</h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">Volume by severity tier</p>
          </div>
          <div className="flex-1 h-48 flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderRadius: '8px', color: '#111827', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {riskDistribution.map((tier, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: tier.color }}></div>
                <span className="text-xs text-gray-700 font-bold">{tier.name}</span>
                <span className="text-xs text-gray-500 font-mono ml-auto font-semibold">{tier.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Queue Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-gray-900">Priority Alert Queue</h3>
          </div>
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Search alerts..." className="bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 transition-colors w-48 placeholder:text-gray-400" />
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg transition-colors">
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Alert ID</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Severity / Score</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Target Entity</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Detection Vector</th>
                <th className="px-5 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50 transition-colors group cursor-pointer bg-white">
                  <td className="px-5 py-3 font-mono text-xs font-bold text-blue-600">
                    <Link href={`/analyst/investigation/${alert.id}`}>{alert.id}</Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        alert.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                        {alert.riskLevel}
                      </span>
                      <span className="font-mono text-xs font-bold text-gray-500">{alert.riskScore}/100</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-gray-700 truncate max-w-[200px]">{alert.customer}</td>
                  <td className="px-5 py-3 text-xs font-mono font-bold text-gray-900">{alert.amount}</td>
                  <td className="px-5 py-3 text-xs font-medium text-gray-600">{alert.reason}</td>
                  <td className="px-5 py-3 text-right">
                    <Link 
                      href={`/analyst/investigation/${alert.id}`}
                      className="inline-flex items-center justify-center gap-1 text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-md border border-transparent hover:border-blue-600 transition-all text-xs font-bold"
                    >
                      Triage <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtext, highlight = 'text-gray-900', icon, bg = 'bg-white', border = 'border-gray-200' }: { title: string, value: string, subtext: string, highlight?: string, icon: React.ReactNode, bg?: string, border?: string }) {
  return (
    <div className={`${bg} p-5 rounded-xl border ${border} shadow-sm flex flex-col relative overflow-hidden group`}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <div className="p-2 bg-gray-50 rounded-lg border border-gray-100 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      <div className="relative z-10 mt-auto">
        <p className={`text-2xl font-mono font-black tracking-tight ${highlight}`}>{value}</p>
        <p className="text-[10px] text-gray-500 mt-1 font-bold">{subtext}</p>
      </div>
    </div>
  );
}
