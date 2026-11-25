import { useState, type FormEvent } from 'react';
import { ExternalLink, MapPin, MessageSquare, Send } from 'lucide-react';
import type { ChatTurn, VenueRecord } from '../types/venue';
import { buildGoogleMapsPlaceUrl, formatMxn } from '../utils/maps';

interface AssistantPanelProps {
  onSelectVenueOnMap: (venue: VenueRecord) => void;
  totalRecords: number;
}

const SUGGESTED_PROMPTS = [
  '¿Qué salones registrados admiten 80 invitados?',
  '¿Qué necesito para organizar una fiesta de cumpleaños?',
  '¿Qué servicios del catálogo incluyen decoración?',
];

export function AssistantPanel({ onSelectVenueOnMap, totalRecords }: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      role: 'model',
      text: `Hola. Tengo acceso en tiempo real a los ${totalRecords} salones y proveedores registrados en el catálogo. Pregúntame por capacidad de invitados, servicios de decoración, presupuestos o cómo organizar tu celebración.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuery = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    const nextHistory = [...messages, { role: 'user' as const, text: trimmed }];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo consultar al asistente');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: data.reply,
          referencedVenues: Array.isArray(data.referencedVenues) ? data.referencedVenues : [],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el asistente Gemini');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Asistente inteligente de celebraciones
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Consultas dinámicas sobre registros reales del catálogo mediante Gemini.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-500">
          {totalRecords} registros consultables
        </span>
      </div>

      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Consultas rápidas:</span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={loading}
            onClick={() => sendQuery(prompt)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-[#0F766E] hover:text-[#0F766E] rounded-lg transition-colors text-left"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4 max-h-[460px] overflow-y-auto bg-white">
        {messages.map((turn, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-3xl rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                turn.role === 'user'
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
            >
              {turn.text}
            </div>

            {turn.referencedVenues && turn.referencedVenues.length > 0 && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-3xl">
                {turn.referencedVenues.map((venue) => (
                  <div
                    key={venue.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{venue.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                        {venue.capacity} inv. · {formatMxn(venue.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectVenueOnMap(venue)}
                        className="p-1.5 text-slate-600 hover:text-[#0F766E] hover:bg-slate-100 rounded-md transition-colors"
                        title="Ubicar en OpenStreetMap"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                      <a
                        href={buildGoogleMapsPlaceUrl(venue.latitude, venue.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-600 hover:text-[#0F766E] hover:bg-slate-100 rounded-md transition-colors"
                        title="Abrir en Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MessageSquare className="w-4 h-4 animate-pulse text-[#0F766E]" />
            Consultando registros del catálogo con Gemini...
          </div>
        )}

        {error && (
          <div className="px-4 py-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta por capacidad, decoración, cumpleaños, disponibilidad o precios..."
          className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#0F766E] hover:bg-[#0D625B] rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <Send className="w-4 h-4" />
          Consultar
        </button>
      </form>
    </div>
  );
}
