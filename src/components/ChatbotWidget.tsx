import React, { useEffect, useRef, useState } from 'react';
import { Bot, Calendar, Check, ChevronDown, ExternalLink, HelpCircle, Loader2, MessageSquare, Minimize2, Send, Sparkles, User, Wrench, X, Zap } from 'lucide-react';
import { ChatMessage, TechnologyType, UiAction } from '../types';

interface ChatbotWidgetProps {
  onScheduleMeeting: () => void;
  onSelectMaterialByName: (materialName: string) => void;
  onNavigateToSection: (section: 'viewer' | 'config' | 'portal') => void;
  onExecuteUiAction?: (action: UiAction) => void;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  onScheduleMeeting,
  onSelectMaterialByName,
  onNavigateToSection,
  onExecuteUiAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [executedActionIds, setExecutedActionIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '¡Hola! Soy **Proyect3d Bot**, tu asesor técnico en ingeniería y fabricación aditiva avanzada. Puedo responder tus dudas sobre tolerancias ISO 2768, materiales, DFAM, y **controlar la interfaz en tiempo real** (cambiar a resina, activar modo rayos X, optimizar la orientación 3D o abrir la pasarela de pago). ¿En qué te ayudo hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickQuestions = [
    'Optimiza la orientación 3D para menor coste',
    'Cámbialo a resina de alta precisión',
    'Muestra el mapa de calor DFAM de espesores',
    'Activa la vista radiografía X-Ray',
    'Quiero cotización formal en PDF',
    'Quiero agendar reunión con un ingeniero',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-6),
        }),
      });

      const data = await response.json();
      const botText = data.reply || data.fallback || 'Entendido. ¿En qué otro aspecto de ingeniería puedo asistirte?';
      const uiAction: UiAction | undefined = data.uiAction;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        uiAction: uiAction,
      };

      setMessages((prev) => [...prev, botMsg]);

      // If action is detected, auto-execute if requested or prompt user
      if (uiAction && onExecuteUiAction) {
        onExecuteUiAction(uiAction);
        setExecutedActionIds((prev) => [...prev, botMsg.id]);
      }
    } catch (err) {
      console.error('Chatbot request failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'model',
          text: 'Nuestro sistema de ingeniería está disponible. Para requerimientos especiales o tolerancias ISO 2768, puedes agendar directamente una reunión técnica.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          uiAction: {
            type: 'SCHEDULE_MEETING',
            label: 'Agendar Cita Técnica con Ingeniero',
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (msgId: string, action: UiAction) => {
    if (onExecuteUiAction) {
      onExecuteUiAction(action);
      setExecutedActionIds((prev) => [...prev, msgId]);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-full font-bold text-xs shadow-2xl transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-neutral-950" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
          </div>
          <span>Proyect3d Bot</span>
          <span className="hidden sm:inline text-[11px] font-normal text-neutral-800">· Asesor RAG & UI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-[420px] h-[600px] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                  Proyect3d Bot
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-[10px] font-normal font-mono text-amber-400">UI Controller Activo</span>
                </div>
                <div className="text-[10px] text-neutral-400">Ingeniería RAG & Control de Interfaz</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => {
              const isBot = m.role === 'model';
              const isExecuted = executedActionIds.includes(m.id);

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                      isBot
                        ? 'bg-neutral-950 border border-neutral-800 text-neutral-200'
                        : 'bg-amber-400 text-neutral-950 font-medium'
                    }`}
                  >
                    {m.text}
                  </div>

                  {/* UI Action Trigger Badge */}
                  {m.uiAction && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        onClick={() => handleActionClick(m.id, m.uiAction!)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shadow-sm ${
                          isExecuted
                            ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
                        }`}
                      >
                        {isExecuted ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Acción ejecutada: {m.uiAction.label}</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-neutral-950" />
                            <span>Ejecutar en UI: {m.uiAction.label}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] text-neutral-500 mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-neutral-400 text-xs p-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Analizando con base de conocimiento técnico y resolviendo acciones de UI...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-neutral-950/80 border-t border-neutral-800/80 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md whitespace-nowrap transition-colors border border-neutral-700/50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Prueba 'Cámbialo a resina', 'Optimiza la pieza', 'Rayos X'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
