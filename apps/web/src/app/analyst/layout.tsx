'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShieldAlert, Search, Settings, User, Bell } from 'lucide-react';

export default function AnalystLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] text-gray-900 font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col relative z-20">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-sm">
            T
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">TrustFlow</h2>
            <p className="text-[10px] uppercase tracking-widest text-blue-600 font-mono mt-0.5">Analyst Portal</p>
          </div>
        </div>
        
        <div className="p-4">
          <nav className="space-y-1">
            <Link href="/analyst" className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
              <ShieldAlert className="h-4 w-4" />
              Alert Queue
            </Link>
            <Link href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
              <Search className="h-4 w-4" />
              Investigations
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 px-2 py-2 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Ankit C.</p>
              <p className="text-[10px] text-gray-500 font-mono">Online</p>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                window.location.href = '/login?role=ANALYST';
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex justify-between items-center shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-gray-900">
              Risk Intelligence Center
            </h1>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {children}
        </div>
      </main>
    </div>
  );
}
