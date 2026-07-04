import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, ShieldAlert, Trash2, ArrowRight, X } from 'lucide-react';
import { UserModel, MuscleGroup, FatigueInfo } from '../types';
import { AuraLogo } from './AuraLogo';


interface ChatMessage {
  id: string;
  text: string;
  role: 'user' | 'model';
  timestamp: number;
}

interface ChatProps {
  userModel: UserModel;
  history: any[];
  fatigue: Record<MuscleGroup, FatigueInfo>;
  isRestDay?: boolean;
  onClose: () => void;
}

export default function Chat({ userModel, history, fatigue, isRestDay, onClose }: ChatProps) {
  const accentText = isRestDay ? 'text-sky-400' : 'text-emerald-400';
  const accentBg = isRestDay ? 'bg-sky-500/10' : 'bg-emerald-500/10';
  const accentBorder = isRestDay ? 'border-sky-500/20' : 'border-emerald-500/20';

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('aura_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    
    // Default initial greeting message
    return [
      {
        id: 'welcome',
        text: `Hoi ${userModel.name || 'Atleet'}! Ik ben Aura, je persoonlijke AI fitness coach. Vraag me alles over je trainingen, spierherstel, voeding of blessures. Hoe kan ik je vandaag helpen?`,
        role: 'model',
        timestamp: Date.now()
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem('aura_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      text: textToSend.trim(),
      role: 'user',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Map message history to schema expected by backend (limit to last 10 messages for token efficiency)
      const chatHistory = messages.slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userModel,
          metrics: fatigue,
          history: history.slice(0, 8),
          chatHistory,
          message: userMsg.text,
          userApiKey: undefined
        })
      });

      if (!response.ok) {
        throw new Error('Verbindingsfout met server.');
      }

      const data = await response.json();
      const responseText = data.text;
      
      const modelMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        text: responseText || 'Ik kon geen antwoord formuleren.',
        role: 'model',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_err',
        text: 'Ik ondervind momenteel verbindingsproblemen met de AI-cloud. Zullen we het over een momentje nog eens proberen?',
        role: 'model',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Weet je zeker dat je het chatgesprek wilt wissen?")) {
      const reset = [
        {
          id: 'welcome',
          text: `Gesprek gewist. Hoi ${userModel.name || 'Atleet'}! Vraag me gerust weer om advies over je trainingen of spierherstel.`,
          role: 'model',
          timestamp: Date.now()
        }
      ];
      setMessages(reset);
    }
  };

  // Suggestion chips based on user state
  const suggestions = [
    "Hoe herstel ik sneller van mijn training?",
    "Geef me een alternatief voor Squats",
    "Is mijn eiwit-inname goed voor spiergroei?",
    "Wat kan ik doen tegen spierpijn?"
  ];

  return (
    <div className="absolute inset-0 pb-[92px] bg-transparent flex flex-col z-30 animate-fadeIn overflow-hidden">
      {/* Subtle sub-header */}
      <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isRestDay ? 'bg-sky-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 font-mono">
            Aura AI Coach Actief
          </span>
        </div>
        <button
          onClick={handleClearHistory}
          className="p-1.5 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-xl text-white/40 hover:text-red-400 active:scale-95 transition-all cursor-pointer"
          title="Gesprek wissen"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar relative z-10">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            {/* Avatar bubble */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              msg.role === 'user' 
                ? 'bg-white/10 text-white/80' 
                : `${accentBg} border ${accentBorder} text-white`
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className={`w-4 h-4 ${accentText}`} />}
            </div>

            {/* Bubble content */}
            <div className={`rounded-2xl p-3.5 text-xs leading-relaxed shadow-lg font-light ${
              msg.role === 'user'
                ? isRestDay
                  ? 'bg-sky-500/10 text-sky-100 border border-sky-500/20'
                  : 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20'
                : 'bg-white/[0.02] text-white/90 border border-white/5'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <span className="text-[8px] text-white/20 font-mono block mt-2 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center animate-pulse">
            <div className={`w-8 h-8 rounded-xl ${accentBg} border ${accentBorder} flex items-center justify-center text-white shrink-0`}>
              <Sparkles className={`w-4 h-4 animate-pulse ${accentText}`} />
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex gap-1">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-150" />
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && !isTyping && (
        <div className="px-6 py-3 border-t border-white/5 bg-black/10 flex gap-2 overflow-x-auto no-scrollbar shrink-0 z-10">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s)}
              className={`px-3 py-2 bg-white/5 hover:${accentBg} border border-white/5 hover:${accentBorder} text-[10px] text-white/60 hover:${accentText} rounded-xl flex items-center gap-1 active:scale-95 transition-all shrink-0 cursor-pointer`}
            >
              <span>{s}</span>
              <ArrowRight className="w-3 h-3 text-white/30" />
            </button>
          ))}
        </div>
      )}

      {/* Message input bar */}
      <div className="p-4 border-t border-white/5 bg-[#050505]/60 backdrop-blur-md shrink-0 flex gap-2 z-10">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage(inputText)}
          placeholder="Stel Aura een fitness vraag..."
          className="flex-1 bg-white/5 border border-white/5 focus:border-white/10 rounded-2xl py-3 px-4 text-xs text-white placeholder-white/30 focus:outline-none transition-all"
          disabled={isTyping}
        />
        <button
          disabled={!inputText.trim() || isTyping}
          onClick={() => handleSendMessage(inputText)}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all active:scale-95 ${
            inputText.trim() && !isTyping
              ? isRestDay
                ? 'bg-sky-500 text-black border-sky-400 cursor-pointer shadow-lg shadow-sky-500/10'
                : 'bg-emerald-500 text-black border-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/10'
              : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
