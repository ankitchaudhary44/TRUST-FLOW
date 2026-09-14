'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// Custom hook for typewriter effect
function useTypewriter(text: string, speed: number = 50, startDelay: number = 0) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const startTyping = () => {
      setIsTyping(true);
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(text.substring(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(intervalId);
          setIsTyping(false);
        }
      }, speed);
      return intervalId;
    };

    if (startDelay > 0) {
      timeoutId = setTimeout(() => {
        const interval = startTyping();
        return () => clearInterval(interval);
      }, startDelay);
    } else {
      const interval = startTyping();
      return () => clearInterval(interval);
    }

    return () => clearTimeout(timeoutId);
  }, [text, speed, startDelay]);

  return { displayedText, isTyping };
}

export default function Home() {
  const { displayedText: titleText, isTyping: titleTyping } = useTypewriter("Adaptive Financial Trust", 60, 300);
  const { displayedText: subText, isTyping: subTyping } = useTypewriter("Detect the risk behind the transaction, not just the transaction itself.", 35, 1800);
  
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    // Show buttons after the subtitles finish typing (~1800 + 35*70 = ~4250ms)
    const timer = setTimeout(() => setShowButtons(true), 4200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 text-gray-900 transition-all duration-1000">
      <div className="mt-16 flex flex-col items-center w-full max-w-3xl min-h-[300px]">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6 min-h-[72px] flex items-center justify-center">
          {titleText}
          <span className={`inline-block w-[3px] h-[50px] bg-blue-600 ml-1 ${titleTyping ? 'animate-pulse' : 'hidden'}`}></span>
        </h1>
        
        <p className="text-xl text-gray-600 text-center mb-10 min-h-[28px] flex items-center justify-center">
          {subText}
          <span className={`inline-block w-[2px] h-[20px] bg-gray-400 ml-1 ${!titleTyping && subTyping ? 'animate-pulse' : 'hidden'}`}></span>
        </p>
        
        <div className={`flex gap-4 transition-all duration-1000 transform ${showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link href="/login?role=CUSTOMER" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30">
            Customer Interface
          </Link>
          <Link href="/login?role=ANALYST" className="px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors shadow-lg hover:shadow-gray-900/30">
            Analyst Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
