import { GoogleGenAI, Type } from '@google/genai';
import type { VenueRecord } from '../src/types/venue.ts';

interface HistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface AssistantResponse {
  reply: string;
  referencedVenues: VenueRecord[];
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function askVenueAssistant(
  userMessage: string,
  venues: VenueRecord[],
  history: HistoryItem[] = []
): Promise<AssistantResponse> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Falta configurar GEMINI_API_KEY en el servidor (Settings > Secrets o variables de entorno de Render).'
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const catalogSnapshot = venues.map((v) => ({
    id: v.id,
    nombre: v.name,
    tipo: v.category === 'salon' ? 'Salón de eventos' : 'Proveedor de servicios',
    capacidad_maxima: v.capacity,
    servicios: v.services,
    precio_mxn: v.price,
    unidad_precio: v.price_unit,
    disponible: v.available,
    notas_disponibilidad: v.availability_notes,
    direccion: v.address,
    coordenadas: { lat: v.latitude, lng: v.longitude },
    contacto: `${v.contact_name} (${v.contact_phone})`,
    descripcion: v.description,
  }));

  const systemInstruction = `Eres el asistente inteligente de Atrio Eventos, un sistema profesional de salones de eventos y proveedores de servicios para celebraciones.
Tu tarea es responder preguntas de los usuarios en español de forma clara, precisa y útil, consultando EXCLUSIVAMENTE los registros reales del catálogo proporcionados abajo.

Reglas estrictas:
1. Nunca inventes salones, capacidades, precios ni teléfonos que no aparezcan en el catálogo real.
2. Cuando te pregunten por capacidad (ejemplo: "¿Qué salones registrados admiten 80 invitados?"), incluye todos los salones cuya capacidad_maxima sea >= 80 e indica su capacidad exacta, precio, disponibilidad y dirección.
3. Cuando te pregunten por servicios (ejemplo: "¿Qué servicios del catálogo incluyen decoración?"), revisa tanto salones como proveedores que incluyan decoración o ambientación en sus servicios o descripción.
4. Cuando te pregunten qué necesitan para organizar una celebración (ejemplo: "¿Qué necesito para organizar una fiesta de cumpleaños?"), da una lista práctica paso a paso (lugar, capacidad, banquete/pastelería, música/iluminación, decoración, confirmación) y recomienda específicamente los salones y proveedores reales de nuestro catálogo que cubren esos puntos.
5. Incluye los IDs exactos de los registros que menciones en el campo "referencedVenueIds" del JSON de salida.
6. Mantén un tono cordial, conciso y estructurado con viñetas claras en el texto de "reply".

CATÁLOGO ACTUAL EN BASE DE DATOS (${catalogSnapshot.length} registros):
${JSON.stringify(catalogSnapshot, null, 2)}`;

  const contents = [
    ...history.slice(-6).map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: userMessage }],
    },
  ];

  let response;
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Respuesta completa y bien redactada en español para el usuario.',
              },
              referencedVenueIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de IDs exactos de los salones o proveedores mencionados en la respuesta.',
              },
            },
            required: ['reply', 'referencedVenueIds'],
          },
        },
      });
      break;
    } catch (err) {
      lastError = err;
      const errStr = err instanceof Error ? err.message : String(err);
      const isTransient = errStr.includes('503') || errStr.includes('429') || errStr.includes('UNAVAILABLE');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * Math.pow(2, attempt - 1)));
    }
  }

  if (!response) {
    throw lastError instanceof Error ? lastError : new Error('No se recibió respuesta del asistente Gemini.');
  }

  const rawText = (response.text ?? '').trim();
  let reply = 'No se pudo generar una respuesta en este momento.';
  let referencedIds: string[] = [];

  try {
    const parsed = JSON.parse(rawText) as { reply?: string; referencedVenueIds?: string[] };
    if (typeof parsed.reply === 'string' && parsed.reply.trim()) {
      reply = parsed.reply.trim();
    }
    if (Array.isArray(parsed.referencedVenueIds)) {
      referencedIds = parsed.referencedVenueIds.map(String);
    }
  } catch {
    if (rawText) {
      reply = rawText;
    }
  }

  const venueById = new Map(venues.map((v) => [v.id, v]));
  const referencedVenues = referencedIds
    .map((id) => venueById.get(id))
    .filter((v): v is VenueRecord => Boolean(v));

  return {
    reply,
    referencedVenues,
  };
}
