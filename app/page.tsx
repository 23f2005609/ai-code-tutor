'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Sidebar visibility state (desktop & mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Storage and chat management state
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');

  // Renaming state
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Active chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [code, setCode] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const savedChats = localStorage.getItem('code-tutor-chats');
    if (savedChats) {
      try {
        setChats(JSON.parse(savedChats));
      } catch (e) {
        console.error('Failed to parse chats', e);
      }
    }
    setActiveChatId(Date.now().toString());
  }, []);

  useEffect(() => {
    if (messages.length === 0 || !isMounted) return;

    setChats((prevChats) => {
      const existingChatIndex = prevChats.findIndex((c) => c.id === activeChatId);
      let updatedChats = [...prevChats];

      if (existingChatIndex >= 0) {
        updatedChats[existingChatIndex] = {
          ...updatedChats[existingChatIndex],
          messages,
          updatedAt: Date.now(),
        };
      } else {
        const snippet = messages[0].content
          .replace('Here is the code I need you to teach me:\n\n', '')
          .split('\n')[0]
          .substring(0, 25);
        const newChat: ChatSession = {
          id: activeChatId,
          title: snippet ? snippet + '...' : 'New Analysis',
          messages,
          updatedAt: Date.now(),
        };
        updatedChats = [newChat, ...prevChats];
      }

      localStorage.setItem('code-tutor-chats', JSON.stringify(updatedChats));
      return updatedChats;
    });
  }, [messages, activeChatId, isMounted]);

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId]);

  const startNewChat = () => {
    setActiveChatId(Date.now().toString());
    setMessages([]);
    setCode('');
    setFollowUp('');
    setError('');
  };

  const loadChat = (chatId: string) => {
    if (editingChatId === chatId) return;
    const chatToLoad = chats.find((c) => c.id === chatId);
    if (chatToLoad) {
      setActiveChatId(chatToLoad.id);
      setMessages(chatToLoad.messages);
      setError('');
    }
  };

  const handleStartRename = (e: React.MouseEvent, chat: ChatSession) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleSaveRename = (chatId: string) => {
    if (!editingTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    setChats((prevChats) => {
      const updated = prevChats.map((c) =>
        c.id === chatId ? { ...c, title: editingTitle.trim() } : c
      );
      localStorage.setItem('code-tutor-chats', JSON.stringify(updated));
      return updated;
    });

    setEditingChatId(null);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChats((prevChats) => {
      const updated = prevChats.filter((c) => c.id !== chatId);
      localStorage.setItem('code-tutor-chats', JSON.stringify(updated));
      return updated;
    });

    if (activeChatId === chatId) {
      startNewChat();
    }
  };

  const handleSend = async (isFollowUp: boolean) => {
    if (!isFollowUp && !code.trim()) return;
    if (isFollowUp && !followUp.trim()) return;

    setLoading(true);
    setError('');

    const newUserMessageContent = isFollowUp
      ? followUp
      : `Here is the code I need you to teach me:\n\n${code}`;
    const newUserMessage: Message = { role: 'user', content: newUserMessageContent };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    if (isFollowUp) setFollowUp('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (data.result) {
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

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
      
      {/* Collapsible Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full border-none'
        } transition-all duration-300 ease-in-out fixed md:static inset-y-0 left-0 bg-gray-950 border-r border-gray-800 flex flex-col z-50 overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-800 flex-shrink-0">
          <h2 className="font-bold text-lg text-blue-400 truncate">Chat History</h2>
          
          {/* Close Sidebar Button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex-shrink-0">
          <button
            onClick={startNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
          >
            + New Chat
          </button>
        </div>

        {/* Chat Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => loadChat(chat.id)}
              className={`group relative flex items-center justify-between p-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
                chat.id === activeChatId
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
              }`}
            >
              {editingChatId === chat.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(chat.id);
                    if (e.key === 'Escape') setEditingChatId(null);
                  }}
                  onBlur={() => handleSaveRename(chat.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-gray-900 text-white px-2 py-1 rounded border border-blue-500 outline-none text-xs"
                />
              ) : (
                <>
                  <span className="truncate pr-12">{chat.title}</span>
                  <div className="absolute right-2 hidden group-hover:flex items-center space-x-1">
                    {/* Rename Button */}
                    <button
                      onClick={(e) => handleStartRename(e, chat)}
                      className="p-1 hover:text-blue-400 text-gray-400 transition-colors"
                      title="Rename"
                    >
                      ✏️
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="p-1 hover:text-red-400 text-gray-400 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {chats.length === 0 && (
            <p className="text-gray-500 text-sm text-center mt-4">No previous chats</p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative bg-gray-900">
        
        {/* Top Navbar with Sidebar Re-open Button */}
        <header className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-950 flex-shrink-0">
          <div className="flex items-center space-x-4">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors flex items-center space-x-1"
                title="Open Sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                <span className="text-xs hidden sm:inline">Chats</span>
              </button>
            )}
            <h1 className="font-bold text-xl text-lime-300">AI Code Tutor 🧑🏻‍🏫</h1>
          </div>
        </header>

        {/* Chat Display Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col p-4 sm:p-8 space-y-4 min-h-0 pb-4">

            {messages.length === 0 && (
              <section className="space-y-4 shadow-xl flex-shrink-0 mt-4">
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

            {messages.length > 0 && (
              <section className="flex-grow bg-gray-800 rounded-lg border border-gray-700 p-4 overflow-y-auto space-y-6 shadow-xl">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-blue-900 border border-blue-700'
                          : 'bg-gray-900 border border-gray-600'
                      }`}
                    >
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
        </div>
      </main>
    </div>
  );
}