'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [code, setCode] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // New dedicated error state

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    setAnalysis('');
    setError(''); // Clear any previous errors

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      
      if (data.result) {
        setAnalysis(data.result);
      } else {
        // Route API errors to the new error state
        setError(data.error || 'Something went wrong on the server.');
      }
    } catch (err) {
      // Route network errors to the new error state
      setError('Failed to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="text-center space-y-2 mt-4 sm:mt-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-blue-400">AI Code Tutor</h1>
          <p className="text-gray-400 text-base sm:text-lg">Paste code you want to understand, not just copy.</p>
        </header>

        <section className="space-y-4 shadow-xl">
          <textarea
            className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-y"
            placeholder="Paste your code snippet here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          ></textarea>
          
          <button
            onClick={handleAnalyze}
            disabled={loading || !code.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md flex justify-center items-center"
          >
            {loading ? 'Analyzing Code...' : 'Teach Me This Code'}
          </button>
        </section>

        {/* Dedicated Error Banner */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg flex items-center shadow-md">
            <span className="mr-2">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Analysis Output Container */}
        {analysis && !error && (
          <section className="bg-gray-800 p-4 sm:p-8 rounded-lg border border-gray-700 shadow-xl overflow-x-auto">
            <div className="prose prose-invert prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 max-w-none">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </section>
        )}
        
      </div>
    </main>
  );
}