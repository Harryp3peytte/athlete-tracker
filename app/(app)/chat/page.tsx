'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { MessageCircle, Send, Bot, User } from 'lucide-react';
import type { ChatMessage } from '@/types';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/chat/history').then(r => r.json()).then(setMessages).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      athlete_id: '',
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage.content }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        athlete_id: '',
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Réessayez.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 glass-subtle rounded-xl flex items-center justify-center">
          <Bot size={20} style={{ color: '#2AC956' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold">FitCoach IA</h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ton assistant nutrition &amp; sport</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            <MessageCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--text-quaternary)' }} />
            <p className="font-medium">Commence une conversation !</p>
            <p className="text-sm mt-1">Demande des conseils repas, entraînement, ou une analyse de ta journée.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Que manger ce soir ?', 'Analyse ma journée', 'Propose un entraînement', 'Idée de recette protéinée'].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="glass-subtle px-3 py-1.5 rounded-xl text-xs transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 glass-subtle rounded-lg flex-shrink-0 flex items-center justify-center">
                <Bot size={14} style={{ color: '#2AC956' }} />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'rounded-br-md' : 'glass-subtle rounded-bl-md'
              }`}
              style={msg.role === 'user'
                ? { background: 'linear-gradient(135deg, #10B981, #059669)', color: 'var(--text-primary)' }
                : { color: 'var(--text-primary)' }
              }
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="text-xs mt-1" style={{ color: msg.role === 'user' ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 glass-subtle rounded-lg flex-shrink-0 flex items-center justify-center">
                <User size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 glass-subtle rounded-lg flex-shrink-0 flex items-center justify-center">
              <Bot size={14} style={{ color: '#2AC956' }} />
            </div>
            <div className="glass-subtle px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-tertiary)', animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-tertiary)', animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--text-tertiary)', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 mt-4 pt-4" style={{ borderTop: '0.5px solid var(--separator)' }}>
        <input
          className="input-field flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Pose ta question..."
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
