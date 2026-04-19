import { useState, useCallback } from 'react';

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface RentBuddyMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface RoomContext {
  title: string;
  locality: string;
  city: string;
  rent: number;
  type: string;
  furnished: boolean;
}

const SYSTEM_PROMPT = `You are Rent Buddy, a helpful AI assistant embedded in REHWAS — 
India's rental platform. You help Indian tenants and landlords 
with practical rental advice. You know about: Indian rental laws 
(Rent Control Acts, tenant rights, deposit norms), market prices 
by city and locality, how to write rent agreements, how to handle 
disputes, electricity bill calculations, and PG rules. 
Always respond in a friendly, practical tone. Use Indian context 
(₹ symbol, Indian cities, Indian laws). When you don't know 
current market prices exactly, give a realistic range and suggest 
the user check REHWAS listings for current data. Keep responses 
concise — under 150 words unless the user asks for detail.`;

/**
 * useRentBuddy Hook
 * 
 * WHAT IT DOES: Manages the state and API communication for the Rent Buddy AI assistant.
 * 
 * MULTI-TURN CONVERSATION PATTERN:
 * Think of this like giving a new assistant the entire transcript of a meeting 
 * before asking them a "follow-up" question. LLMs like Gemini (and Claude) 
 * are stateless. They don't "remember" previous messages unless we send the 
 * entire history back to them in every single request.
 * 
 * We maintain an array of messages and send the full array to the API so Gemini 
 * can understand context (e.g., if the user says "Is that too high?", the AI 
 * knows they are referring to the rent mentioned previously).
 */
export const useRentBuddy = () => {
  const [messages, setMessages] = useState<RentBuddyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = async (content: string, roomContext?: RoomContext) => {
    if (!content.trim()) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError('Gemini API key is not configured.');
      return;
    }

    // Capture current messages to avoid race conditions
    const currentMessages = [...messages];
    const userMsg: RentBuddyMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      // Build system prompt with room context if available
      let fullSystemPrompt = SYSTEM_PROMPT;
      if (roomContext) {
        fullSystemPrompt += `\n\nCONTEXT INJECTION: The user is currently viewing: ${roomContext.title} in ${roomContext.locality}, ${roomContext.city}. Rent: ₹${roomContext.rent}/month. Type: ${roomContext.type}. Furnished: ${roomContext.furnished ? 'Yes' : 'No'}. If they ask about this listing, you can reference these details.`;
      }

      // Map history to Gemini format
      const history: GeminiContent[] = currentMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Current user message
      history.push({
        role: 'user',
        parts: [{ text: content }],
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          contents: history,
          system_instruction: {
            parts: [{ text: fullSystemPrompt }]
          },
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from Gemini API');
      }

      const data = await response.json();
      const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!assistantText) {
        throw new Error('Invalid response from AI');
      }

      const assistantMsg: RentBuddyMessage = {
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Rent Buddy Error:', err);
      setError('Rent Buddy is unavailable right now. Try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation,
  };
};
