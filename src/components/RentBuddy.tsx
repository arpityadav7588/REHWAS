import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles, X, Send, Bot, User, Loader2, AlertCircle, Trash2, ChevronRight
} from 'lucide-react';
import { useRentBuddy } from '@/hooks/useRentBuddy';
import { useRooms } from '@/hooks/useRooms';
import { useAuth } from '@/hooks/useAuth';
import type { Room } from '@/types';

const SUGGESTED_PROMPTS = {
  tenants: [
    "Is this rent fair for my area?",
    "What documents does a landlord legally need from me?",
    "How much security deposit is normal in India?",
    "My landlord won't return my deposit — what can I do?"
  ],
  landlords: [
    "How do I legally increase rent?",
    "What are my rights if a tenant stops paying?",
    "How do I calculate electricity bill per tenant?",
    "Do I need a registered rent agreement?"
  ]
};

export const RentBuddy: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const { fetchRoomById } = useRooms();
  const { messages, isLoading, error, sendMessage, clearConversation } = useRentBuddy();
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [roomContext, setRoomContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hide on login page
  if (location.pathname === '/login') return null;

  // Detect room context if on room detail page
  useEffect(() => {
    const match = location.pathname.match(/\/room\/([a-zA-Z0-9-]+)/);
    if (match && match[1]) {
      const roomId = match[1];
      const loadRoom = async () => {
        const { data } = await fetchRoomById(roomId);
        if (data) {
          setRoomContext({
            title: data.title,
            locality: data.locality,
            city: data.city,
            rent: data.rent_amount,
            type: data.room_type,
            furnished: data.furnished
          });
        }
      };
      loadRoom();
    } else {
      setRoomContext(null);
    }
  }, [location.pathname]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue.trim(), roomContext);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const prompts = profile?.role === 'landlord' ? SUGGESTED_PROMPTS.landlords : SUGGESTED_PROMPTS.tenants;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 group"
            title="Ask Rent Buddy"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 bg-white text-purple-600 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-purple-200 shadow-sm transition-transform group-hover:scale-110">
              AI
            </span>
          </button>
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl border border-white/10 hidden md:block">
            Ask Rent Buddy
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-slate-900"></div>
          </div>
        </div>
      </div>

      {/* Rent Buddy Drawer */}
      <div 
        className={`fixed inset-0 z-[100] transition-all duration-500 ease-in-out pointer-events-none ${
          isOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        {/* Backdrop for mobile, or just use it to close */}
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"
          onClick={() => setIsOpen(false)}
        ></div>

        <div 
          className={`absolute top-0 right-0 h-full w-full max-w-[380px] bg-slate-50 shadow-2xl transition-transform duration-500 pointer-events-auto flex flex-col ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-600"></div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Rent Buddy ✨</h2>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <Bot size={12} className="text-purple-500" /> Powered by Gemini AI
              </p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button 
                  onClick={clearConversation}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear Conversation"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth">
            {messages.length === 0 && (
              <div className="flex flex-col gap-6 py-4">
                <div className="bg-purple-600/5 border border-purple-100 rounded-3xl p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-200 mb-2 rotate-3 transform">
                    <Sparkles size={32} className="animate-pulse" />
                  </div>
                  <h3 className="font-bold text-slate-800">Namaste! I'm Rent Buddy</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[240px]">
                    Ask me anything about Indian rental laws, market prices, or dispute resolution.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Suggested for you</h4>
                  <div className="flex flex-col gap-2">
                    {prompts.map((prompt, i) => (
                      <button 
                        key={i}
                        onClick={() => sendMessage(prompt, roomContext)}
                        className="bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 p-4 rounded-2xl text-left text-xs font-bold text-slate-700 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                      >
                        <span className="flex-1">{prompt}</span>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 shadow-sm text-[13px] leading-[20px] break-words whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-green-600 text-white rounded-2xl rounded-br-sm font-medium' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm font-medium shadow-purple-500/5'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start w-full animate-pulse">
                <div className="bg-white border border-slate-200 text-slate-500 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-[13px] font-bold">Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-bold text-red-700 leading-tight">
                  {error}
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Disclaimer */}
          <div className="px-4 py-2 border-t border-slate-200">
             <p className="text-[9px] font-bold text-slate-400 text-center leading-tight uppercase tracking-tight">
               Rent Buddy gives general advice, not legal advice. For disputes, consult a lawyer.
             </p>
          </div>

          {/* Input Frame */}
          <div className="bg-white p-4 border-t border-gray-200 shrink-0">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1 focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all shadow-inner">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 font-medium"
                rows={1}
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl shrink-0 transition-all ${!inputValue.trim() || isLoading ? 'bg-slate-200 text-slate-400' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 active:scale-95'}`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
