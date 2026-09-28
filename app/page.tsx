'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

// Define the shape of a message
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState<Message[]>([]); // New array state for history
  const [followUp, setFollowUp] = useState(''); // New state for follow-up questions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Function to handle the initial code submission or follow-up questions
  const handleSend = async (isFollowUp: boolean) => {
    if (!isFollowUp && !code.trim()) return;
    if (isFollowUp && !followUp.trim()) return;

    setLoading(true);
    setError('');

    // Prepare the new user message
    let newUserMessageContent = isFollowUp ? followUp : `Here is the code I need you to teach me:\n\n${code}`;
    const newUserMessage: Message = { role: 'user', content: newUserMessageContent };
    
    // Add it to our local state immediately
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    if (isFollowUp) setFollowUp(''); // Clear follow-up input box

    try {
      // Send the ENTIRE message history to the backend
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }), 
      });

      const data = await response.json();
      
      if (data.result) {
        // Add the AI's response to the history
        setMessages((prev) => [...prev, { role: 'assistant', content: data.result }]);
      } else {
        setError(data.error || 'Something went wrong on the server.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // 1. Changed to strictly h-screen and added overflow-hidden to stop the whole page from scrolling
    <main className="h-screen bg-gray-900 text-gray-100 p-4 sm:p-8 font-sans flex flex-col overflow-hidden">
      {/* 2. Added min-h-0 here. This is the magic flexbox trick that forces inner scrolling */}
      <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col space-y-4 min-h-0 pb-4">
        
        <header className="text-center space-y-2 flex-shrink-0">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-blue-400">AI Code Tutor 🧑🏻‍🏫</h1>
          <p className="text-gray-400 text-base sm:text-lg">Paste code, get an explanation, and ask follow-up questions.</p>
        </header>

        {/* Initial Code Input - Only show if no conversation has started */}
        {messages.length === 0 && (
          <section className="space-y-4 shadow-xl flex-shrink-0">
            <textarea
              className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-y"
              placeholder="Paste your code snippet here to begin..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
            ></textarea>
            <button
              onClick={() => handleSend(false)}
              disabled={loading || !code.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Starting Lesson...' : 'Teach Me This Code'}
            </button>
          </section>
        )}

        {/* Chat History UI */}
        {messages.length > 0 && (
          <section className="flex-grow bg-gray-800 rounded-lg border border-gray-700 p-4 overflow-y-auto space-y-6 shadow-xl">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-4 ${msg.role === 'user' ? 'bg-blue-900 border border-blue-700' : 'bg-gray-900 border border-gray-600'}`}>
                   {msg.role === 'user' ? (
                     <pre className="whitespace-pre-wrap font-mono text-sm">{msg.content}</pre>
                   ) : (
                     <div className="prose prose-invert prose-pre:bg-black prose-pre:border prose-pre:border-gray-700 max-w-none text-sm sm:text-base">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                     </div>
                   )}
                </div>
              </div>
            ))}
            {loading && <div className="text-gray-400 italic text-sm">The tutor is typing...</div>}
            {error && <div className="text-red-400 font-semibold">{error}</div>}
          </section>
        )}

        {/* Follow Up Question Input - Only show if conversation exists */}
        {messages.length > 0 && (
          <section className="flex space-x-2 flex-shrink-0">
            <input
              type="text"
              className="flex-grow p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="Ask a follow-up question..."
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(true)}
              disabled={loading}
            />
            <button
              onClick={() => handleSend(true)}
              disabled={loading || !followUp.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Ask
            </button>
          </section>
        )}
        
      </div>
    </main>
  );
}