import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Trash2, ArrowRight } from 'lucide-react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const SupportChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStaffIncharge, setIsStaffIncharge] = useState(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Unique support session ID to sync with Firestore support_chats portal
  const [sessionId] = useState<string>(() => {
    let id = localStorage.getItem('dlnz_support_session_id');
    if (!id) {
      id = `CHAT-${Math.floor(100000 + Math.random() * 900000)}`;
      localStorage.setItem('dlnz_support_session_id', id);
    }
    return id;
  });

  // Dynamically calculate if standard work hours are currently active (Mon-Fri 9AM - 6PM)
  useEffect(() => {
    const checkWorkHours = () => {
      const now = new Date();
      const day = now.getDay(); // 0 is Sunday, 1-5 is Mon-Fri, 6 is Saturday
      const hour = now.getHours();
      setIsStaffIncharge(day >= 1 && day <= 5 && hour >= 9 && hour < 18);
    };

    checkWorkHours();
    const interval = setInterval(checkWorkHours, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('dlnz_support_chats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'initial',
        role: 'model',
        text: 'Hello, this is JOE at your service. Please let me know how I can assist with your order tracking, delivery status, shipping speed or payment methods today.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time Firestore sync & listener so staff responses update instantly for customer
  useEffect(() => {
    const docRef = doc(db, 'support_chats', sessionId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
          localStorage.setItem('dlnz_support_chats', JSON.stringify(data.messages));
        }
      } else {
        const initialMsgs = [
          {
            id: 'initial',
            role: 'model' as const,
            text: 'Hello, this is JOE at your service. Please let me know how I can assist with your order tracking, delivery status, shipping speed or payment methods today.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
        setDoc(docRef, {
          id: sessionId,
          customerEmail: 'guest',
          lastMessage: 'Hello, this is JOE at your service...',
          updatedAt: serverTimestamp(),
          messages: initialMsgs
        }).catch(err => console.warn('Could not initialize support chats entry in Firestore:', err));
        setMessages(initialMsgs);
      }
    }, (err) => {
      console.warn('Real-time SupportChat Firestore sync error:', err);
    });

    return () => unsub();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText) return;

    if (!textToSend) {
      setInputValue('');
    }

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    setIsLoading(true);

    // Save user's message to Firestore in real-time
    try {
      const docRef = doc(db, 'support_chats', sessionId);
      await setDoc(docRef, {
        id: sessionId,
        customerEmail: 'guest',
        lastMessage: messageText,
        updatedAt: serverTimestamp(),
        messages: updatedWithUser
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore sync user message save exception:', err);
    }

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error('Server connection error');
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'model',
        text: data.reply || 'SYSTEM DIAGNOSTICS: Null response returned. Please retry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedWithUser, modelMsg];
      setMessages(finalMessages);

      // Save JOE's AI response to Firestore for real-time customer support staff logging
      try {
        const docRef = doc(db, 'support_chats', sessionId);
        await setDoc(docRef, {
          id: sessionId,
          customerEmail: 'guest',
          lastMessage: data.reply || 'JOE: payload resolved',
          updatedAt: serverTimestamp(),
          messages: finalMessages
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore sync chatbot response save exception:', err);
      }

    } catch (err) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'model',
        text: 'Connection timed out. Please check your network and retry dispatching your inquiry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const finalFailed = [...updatedWithUser, errorMsg];
      setMessages(finalFailed);

      try {
        const docRef = doc(db, 'support_chats', sessionId);
        await setDoc(docRef, {
          id: sessionId,
          customerEmail: 'guest',
          lastMessage: 'Support Timeout encountered.',
          updatedAt: serverTimestamp(),
          messages: finalFailed
        }, { merge: true });
      } catch (innerErr) {}
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setIsConfirmingClear(true);
  };

  const confirmClearChat = async () => {
    setIsConfirmingClear(false);
    const initialMsgs: ChatMessage[] = [
      {
        id: 'initial',
        role: 'model',
        text: 'Hello, this is JOE at your service. Please let me know how I can assist with your order tracking, delivery status, shipping speed or payment methods today.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(initialMsgs);
    localStorage.setItem('dlnz_support_chats', JSON.stringify(initialMsgs));

    try {
      const docRef = doc(db, 'support_chats', sessionId);
      await setDoc(docRef, {
        id: sessionId,
        customerEmail: 'guest',
        lastMessage: 'Chat history cleared.',
        updatedAt: serverTimestamp(),
        messages: initialMsgs
      }, { merge: true });
    } catch (err) {
      console.warn('Could not clear Firestore support chat log:', err);
    }
  };

  const chips = [
    { label: 'TRACK ORDER', text: 'How do I track my order status?' },
    { label: 'DELIVERY TIME', text: 'What is your shipping speed and delivery timeframe?' },
    { label: 'RETURNS POLICY', text: 'What is your refund / replacement policy?' },
    { label: 'PAYMENT METHODS', text: 'How do I complete my purchase payment?' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="mb-4 w-[360px] sm:w-[400px] h-[520px] bg-black border border-outline-variant/30 shadow-2xl flex flex-col overflow-hidden text-white relative"
          >
            {/* Custom Confirm Clear overlay */}
            <AnimatePresence>
              {isConfirmingClear && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center p-6 text-center select-none"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-red/15 flex items-center justify-center text-brand-red mb-4">
                    <Trash2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="font-display text-sm uppercase tracking-wider mb-2 text-white font-bold">Erase Chat History?</h4>
                  <p className="font-sans text-[11px] text-[#aeaeae] leading-relaxed max-w-[240px] mb-6">
                    This will clear all current messages with JOE from both your browser cache and staff portal databases.
                  </p>
                  <div className="flex gap-3 w-full max-w-[240px]">
                    <button
                      onClick={() => setIsConfirmingClear(false)}
                      className="flex-1 py-2.5 border border-outline-variant/30 text-[10px] uppercase font-bold tracking-widest text-[#aaa] hover:text-white rounded-none cursor-pointer hover:border-white transition-all bg-transparent"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmClearChat}
                      className="flex-1 py-2.5 bg-brand-red text-white text-[10px] uppercase font-bold tracking-widest hover:bg-red-700 rounded-none cursor-pointer transition-all border-none"
                    >
                      Clear Log
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="px-5 py-4 bg-[#0a0a0a] border-b border-outline-variant/30 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {/* No blinking green indicator - solid layout */}
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div>
                  <span className="font-display text-xs uppercase tracking-widest block font-bold text-white">
                    DLNZ CUSTOMER CHAT
                  </span>
                  <span className="font-technical-sm text-[8px] opacity-40 uppercase tracking-widest block">
                    Customer Assistant agent
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearChat}
                  title="Clear Conversation History"
                  className="text-white/40 hover:text-brand-red transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#020202] select-text scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-[11px] leading-relaxed whitespace-pre-line border rounded-sm font-sans ${
                      msg.role === 'user'
                        ? 'bg-brand-red border-brand-red text-white font-medium'
                        : 'bg-[#121212]/90 border-outline-variant/15 text-gray-300'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] font-sans text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                    {msg.role === 'user' ? 'YOU' : 'JOE'} • {msg.timestamp}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start">
                  <div className="bg-[#121212] border border-outline-variant/15 px-4 py-3 rounded-none text-[10px] font-sans text-gray-400 flex items-center gap-1.5">
                    <span className="animate-pulse">JOE is processing payload</span>
                    <span className="flex gap-1">
                      <span className="animate-bounce delay-100">.</span>
                      <span className="animate-bounce delay-200">.</span>
                      <span className="animate-bounce delay-300">.</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggest Chips */}
            <div className="px-5 py-2.5 bg-[#080808] border-t border-outline-variant/10 flex flex-wrap gap-2 overflow-x-auto select-none no-scrollbar">
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleSendMessage(chip.text)}
                  disabled={isLoading}
                  className="px-2 py-1 text-[8px] font-mono border border-outline-variant/20 hover:border-brand-red hover:text-brand-red text-gray-400 uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-4 bg-[#0a0a0a] border-t border-outline-variant/30 flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message JOE..."
                className="flex-1 bg-[#121212] border border-outline-variant/20 px-3.5 py-2.5 text-[11px] font-sans placeholder:opacity-30 focus:outline-none focus:border-brand-red text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-brand-red text-white px-4 flex items-center justify-center hover:bg-brand-red/90 transition-all cursor-pointer disabled:opacity-55 active:scale-95"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Expandable Toggle Button - solid indicator (no blinking green animation) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-brand-red text-white h-12 shadow-2xl border border-white/10 cursor-pointer flex items-center justify-center relative overflow-hidden group select-none rounded-none"
        initial={{ width: 48 }}
        whileHover={{ width: 175 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center justify-center px-3.5 gap-2 w-full whitespace-nowrap">
          <MessageSquare className="w-5 h-5 flex-shrink-0" />
          <span className="text-[9px] font-technical-sm tracking-widest uppercase font-bold overflow-hidden transition-all duration-300 max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 flex-shrink-0">
            CUSTOMER SUPPORT
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
        </div>
      </motion.button>
    </div>
  );
};
