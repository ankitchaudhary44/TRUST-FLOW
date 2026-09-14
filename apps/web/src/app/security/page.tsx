'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogIn, KeyRound, MonitorSmartphone, Activity, ArrowRight } from 'lucide-react';

interface SecurityEvent {
  id: string;
  eventType: string;
  timestamp: string;
  deviceId?: string;
  device?: {
    deviceName: string;
    ipAddress: string;
  };
}

interface SecurityAnalysis {
  isCompromised: boolean;
  threatLevel: 'NONE' | 'ELEVATED' | 'CRITICAL';
  detectedPatterns: string[];
}

export default function SecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);

  // Mocking the data load for Phase 3 UI demonstration
  useEffect(() => {
    // Simulated sequence of an account takeover
    const mockEvents: SecurityEvent[] = [
      {
        id: '4',
        eventType: 'HIGH_VALUE_TRANSFER_ATTEMPT',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        device: { deviceName: 'Unknown Android', ipAddress: '45.22.11.99' }
      },
      {
        id: '3',
        eventType: 'BENEFICIARY_ADDED',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        device: { deviceName: 'Unknown Android', ipAddress: '45.22.11.99' }
      },
      {
        id: '2',
        eventType: 'NEW_DEVICE',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        device: { deviceName: 'Unknown Android', ipAddress: '45.22.11.99' }
      },
      {
        id: '1',
        eventType: 'PASSWORD_CHANGE',
        timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
        device: { deviceName: 'Unknown Android', ipAddress: '45.22.11.99' }
      }
    ];

    const mockAnalysis: SecurityAnalysis = {
      isCompromised: true,
      threatLevel: 'CRITICAL',
      detectedPatterns: ['Classic Account Takeover Sequence Detected (Password Reset + New Device + New Beneficiary)']
    };

    setEvents(mockEvents);
    setAnalysis(mockAnalysis);
  }, []);

  const getIcon = (type: string) => {
    if (type.includes('PASSWORD')) return <KeyRound className="h-5 w-5 text-purple-500" />;
    if (type.includes('DEVICE')) return <MonitorSmartphone className="h-5 w-5 text-blue-500" />;
    if (type.includes('LOGIN')) return <LogIn className="h-5 w-5 text-green-500" />;
    return <Activity className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Timeline</h1>
          <p className="text-gray-600">Track all security events and authentication changes.</p>
        </header>

        {analysis && analysis.threatLevel !== 'NONE' && (
          <div className={`mb-8 p-6 rounded-xl border ${analysis.threatLevel === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="flex items-center gap-4 mb-4">
              <ShieldAlert className={`h-8 w-8 ${analysis.threatLevel === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'}`} />
              <div>
                <h2 className={`text-xl font-bold ${analysis.threatLevel === 'CRITICAL' ? 'text-red-900' : 'text-orange-900'}`}>
                  {analysis.threatLevel} THREAT DETECTED
                </h2>
                <p className={analysis.threatLevel === 'CRITICAL' ? 'text-red-700' : 'text-orange-700'}>
                  Suspicious behavioral sequences identified.
                </p>
              </div>
            </div>
            <ul className="list-disc list-inside space-y-1">
              {analysis.detectedPatterns.map((pattern, idx) => (
                <li key={idx} className={`font-medium ${analysis.threatLevel === 'CRITICAL' ? 'text-red-800' : 'text-orange-800'}`}>
                  {pattern}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Events</h2>
          
          <div className="relative border-l border-gray-200 ml-4 space-y-8">
            {events.map((event) => (
              <div key={event.id} className="relative pl-8">
                <div className="absolute -left-3 top-1 bg-white border-2 border-gray-200 rounded-full p-1">
                  {getIcon(event.eventType)}
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-md font-bold text-gray-900">{event.eventType.replace(/_/g, ' ')}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {event.device && (
                    <p className="text-sm text-gray-600">
                      via {event.device.deviceName} ({event.device.ipAddress})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
