import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Message } from '@/types';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Send, X } from 'lucide-react';
import { prepare, layout } from '@chenglou/pretext';

interface ChatWindowProps {
  roomId: string;
  otherUserId: string;
  otherUserName: string;
  onClose?: () => void;
}

/**
 * ChatWindow Component.
 * WHAT IT DOES: Enables real-time, bi-directional chat between a tenant and a landlord for a specific room.
 * 
 * REALTIME SUBSCRIPTION CONCEPT (PUB/SUB ANALOGY):
 * Think of Supabase Realtime like subscribing to a specific YouTube channel and turning on the bell icon.
 * Here, the "channel" is our chat room (identified by roomId).
 * We tell Supabase: "Hey, whenever a new 'message' is inserted into the database for this room, ping me!"
 * When another user sends a message, it lands in the database. Supabase sees this, and instantly broadcasts 
 * a notification to all active subscribers. Our app receives the notification dynamically and pushes the new 
 * message into the UI immediately, without us ever needing to hard-refresh the page.
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({ roomId, otherUserId, otherUserName, onClose }) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef(new Map<string, any>());
  const [layouts, setLayouts] = useState<Record<string, { height: number; lineCount: number }>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  /**
   * @description pretext prepare() is like asking a tailor to measure a specific piece of fabric (the text) using a specific ruler (the font).
   * We only want to measure the fabric once, so we store the measurements (the opaque handle) in our handles Map.
   * pretext layout() is like asking the tailor "if I have a box this wide, how tall will the folded fabric be?".
   * We can ask this question repeatedly (on resize) using the same pre-measured fabric, meaning pure math calculates the height instantly without re-measuring the fabric itself.
   */
  useEffect(() => {
    if (containerWidth === 0) return;
    
    // Bubble max width = 70% of the chat container width
    const bubbleMaxWidth = containerWidth * 0.7;
    const newLayouts: Record<string, { height: number; lineCount: number }> = {};
    
    messages.forEach(msg => {
      if (!handlesRef.current.has(msg.id)) {
        handlesRef.current.set(msg.id, prepare(msg.content, '15px Plus Jakarta Sans'));
      }
      const handle = handlesRef.current.get(msg.id);
      newLayouts[msg.id] = layout(handle, bubbleMaxWidth, 22); // line height 22
    });
    
    setLayouts(newLayouts);
  }, [messages, containerWidth]);

  // Auto-scroll to the bottom of the chat view whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, layouts]);

  useEffect(() => {
    if (!profile) return;

    /**
     * Bootstraps the chat context by retrieving recent history and subscribing to future real-time blasts.
     */
    const setupChat = async () => {
      // Fetch the last 50 historical messages
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${profile.id})`)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data) setMessages(data as Message[]);

      // Subscribe to Supabase Realtime for instant updates
      const channel = supabase.channel(`chat-${roomId}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `room_id=eq.${roomId}` // Listen dynamically to changes in our room subset
          }, 
          (payload) => {
            const newMsg = payload.new as Message;
            // Making sure it belongs correctly to this specific 1on1 context
            if (
              (newMsg.sender_id === profile.id || newMsg.receiver_id === profile.id) &&
              (newMsg.sender_id === otherUserId || newMsg.receiver_id === otherUserId)
            ) {
              setMessages(prev => {
                // Prevent duplicate optimistic entries
                if (prev.find(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          }
        )
        .subscribe();

      // Cleanup subscription heavily on unmount so we don't leak listeners
      return () => {
         supabase.removeChannel(channel);
      };
    };

    const cleanup = setupChat();
    return () => { cleanup.then(fn => fn && fn()); };
  }, [roomId, otherUserId, profile]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !profile) return;

    const content = inputValue.trim();
    setInputValue(''); // Clear aggressively upfront for perceptual speed

    // Optimistically patch UI for perceived blazing fast chat insertion
    const tempMessage: Message = {
      id: crypto.randomUUID(), 
      room_id: roomId,
      sender_id: profile.id,
      receiver_id: otherUserId,
      content,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMessage]);

    // Commit definitively to Supabase
    await supabase.from('messages').insert([{
      room_id: roomId,
      sender_id: profile.id,
      receiver_id: otherUserId,
      content
    }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /** Helper to format date groups aesthetically */
  const getDateLabel = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'dd MMM yyyy');
  };

  // Group messages structurally dynamically by Date string output
  const groupedMessages: { label: string; messages: Message[] }[] = [];
  let currentGroup = '';

  messages.forEach(msg => {
    const label = getDateLabel(msg.created_at);
    if (label !== currentGroup) {
      currentGroup = label;
      groupedMessages.push({ label, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden shadow-2xl relative">
      <div className="flex items-center justify-between bg-white px-5 py-4 border-b border-gray-200 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-black relative shadow-sm">
             {otherUserName.charAt(0).toUpperCase()}
             <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">{otherUserName}</h3>
            <span className="text-xs text-green-600 font-bold">Online</span>
          </div>
        </div>
        {onClose && (
           <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
             <X size={20} />
           </button>
        )}
      </div>

      {/* Main Messages Body */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
         {groupedMessages.map((group, gIdx) => (
           <div key={gIdx} className="flex flex-col gap-4">
             {/* Sticky Date Separator */}
             <div className="flex justify-center sticky top-2 z-10">
                <span className="bg-white/80 backdrop-blur-md border border-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                  {group.label}
                </span>
             </div>

             {/* Message Bubbles */}
             {group.messages.map(msg => {
               const isMe = msg.sender_id === profile?.id;
               const lStats = layouts[msg.id] || { height: 22, lineCount: 1 };
               const minHeight = lStats.height + 20; // adding vertical py-2.5 padding (20px total)

               return (
                 <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                   <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                     <div 
                       style={{ minHeight: `${minHeight}px` }}
                       className={`px-4 py-2.5 shadow-sm text-[15px] leading-[22px] break-words whitespace-pre-wrap flex ${
                         lStats.lineCount === 1 ? 'flex-row items-center gap-3' : 'flex-col'
                       } ${
                         isMe 
                           ? `bg-[#10B981] text-white ${lStats.lineCount > 1 ? 'rounded-2xl rounded-br-sm' : 'rounded-full rounded-br-sm'}` 
                           : `bg-white border border-gray-200 text-gray-800 ${lStats.lineCount > 1 ? 'rounded-2xl rounded-bl-sm' : 'rounded-full rounded-bl-sm'}`
                       }`}
                     >
                       <div>{msg.content}</div>
                       <span className={`text-[10px] font-semibold shrink-0 ${isMe ? 'text-green-100' : 'text-gray-400'} ${lStats.lineCount > 1 ? 'self-end mt-1' : ''}`}>
                         {format(parseISO(msg.created_at), 'h:mm a')}
                       </span>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         ))}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Frame */}
      <div className="bg-white p-4 border-t border-gray-200 shrink-0">
         <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-3xl p-1.5 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-500/20 transition-all shadow-inner">
           <textarea
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Type a message..."
             className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-base text-gray-800 outline-none scrollbar-none"
             rows={1}
             style={{ height: 'auto' }}
           />
           <button 
             onClick={handleSendMessage}
             disabled={!inputValue.trim()}
             className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full shrink-0 transition-colors shadow-sm ${!inputValue.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'}`}
           >
             <Send size={18} className="ml-0.5" />
           </button>
         </div>
      </div>
    </div>
  );
};
