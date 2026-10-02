import React, { useState, useRef, useEffect } from 'react';
import { Invoice, PublisherProfile } from '../types/invoice';
import { sendChatMessage, ChatMessage, ChatAction } from '../lib/geminiChat';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Scale,
  FileText,
  RotateCcw,
  Bot,
  User,
  ArrowRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface AiChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  publisher: PublisherProfile;
  onApplyAction?: (action: ChatAction) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    sender: 'assistant',
    text: "Bonjour ! Je suis l'**Assistant IA du Journal Alaane**.\n\nJe surveille en temps réel votre dossier de facturation ANEP pour garantir la conformité juridique (Décret 05-468), vérifier le calcul de la TVA 19% et optimiser la saisie de vos Bons de Commande.",
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  },
];

const QUICK_PROMPTS = [
  {
    icon: <FileCheck className="w-3.5 h-3.5 text-slate-700" />,
    label: 'Vérifier conformité ANEP',
    prompt: 'Vérifie si mon dossier de facturation respecte tous les critères de conformité ANEP.',
  },
  {
    icon: <FileText className="w-3.5 h-3.5 text-slate-700" />,
    label: 'Résumer le dossier',
    prompt: 'Fais-moi un résumé complet de la facture pour les archives comptables.',
  },
  {
    icon: <Scale className="w-3.5 h-3.5 text-slate-700" />,
    label: 'Exonération timbre fiscal',
    prompt: "Quelle est la base légale de l'exonération du timbre fiscal pour le règlement BNA ?",
  },
  {
    icon: <Sparkles className="w-3.5 h-3.5 text-slate-700" />,
    label: "Optimiser l'intitulé",
    prompt: "Comment formuler l'objet de l'annonce pour respecter le format officiel ANEP ?",
  },
];

export const AiChatWindow: React.FC<AiChatWindowProps> = ({
  isOpen,
  onClose,
  invoice,
  publisher,
  onApplyAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [appliedActionIds, setAppliedActionIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(query, messages, {
        invoice,
        publisher,
      });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        action: response.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: `Désolé, une erreur est survenue lors de l'analyse : ${err?.message || 'Erreur réseau'}`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAction = (msgId: string, action: ChatAction) => {
    if (onApplyAction) {
      onApplyAction(action);
      setAppliedActionIds((prev) => new Set(prev).add(msgId));
    }
  };

  const handleResetConversation = () => {
    setMessages(INITIAL_MESSAGES);
    setAppliedActionIds(new Set());
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Chat Container: Docked Pill on Desktop, Safe Drawer on Mobile */}
      <div
        className="fixed z-50 flex flex-col bg-white text-slate-900 shadow-2xl border border-slate-200/90 select-none bottom-0 inset-x-0 h-[86vh] rounded-t-3xl overflow-hidden pb-safe animate-in slide-in-from-bottom duration-300 lg:inset-x-auto lg:left-auto lg:right-5 lg:bottom-5 lg:w-[420px] lg:h-[620px] lg:rounded-2xl lg:slide-in-from-bottom-4"
        role="dialog"
        aria-modal="true"
        aria-label="Assistant IA Journal Alaane"
      >
        {/* Header */}
        <div className="h-14 bg-slate-900 text-white px-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs tracking-tight text-white">
                  Assistant IA Journal Alaane
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400">
                Conseiller Juridique & Facturation ANEP (Décret 05-468)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleResetConversation}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Réinitialiser la conversation"
              aria-label="Réinitialiser la conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Fermer la fenêtre d'assistance"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Context Banner */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 font-mono shrink-0">
          <span>Dossier : <strong className="text-slate-900">{invoice.invoice_number}</strong></span>
          <span>{invoice.items.length} BC • <strong className="text-emerald-700">{invoice.amount_ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA</strong></span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isActionApplied = appliedActionIds.has(msg.id);

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 shadow-2xs'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-slate-800" />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/80 shadow-xs'
                    }`}
                  >
                    {/* Render basic markdown bold & lists cleanly */}
                    <div className="whitespace-pre-wrap font-sans text-xs">
                      {msg.text}
                    </div>

                    {/* Interactive Action Chip */}
                    {msg.action && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 font-medium">
                          {msg.action.label}
                        </span>
                        {isActionApplied ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Appliqué
                          </span>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApplyAction(msg.id, msg.action!)}
                            className="h-7 text-[11px] px-2.5 bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            <span>Appliquer</span>
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-slate-800" />
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips Bar */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(qp.prompt)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100/90 text-slate-700 hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 border border-slate-200/60"
            >
              {qp.icon}
              <span>{qp.label}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question sur le dossier ANEP..."
              className="text-xs h-9 bg-white border-slate-200 focus-visible:ring-slate-900 text-slate-900"
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white shrink-0"
              aria-label="Envoyer"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};
