import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { VenueFilters, VenueInput, VenueRecord } from '../src/types/venue.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_STORE_PATH = path.join(DATA_DIR, 'venues_store.json');

const SEED_VENUES: VenueRecord[] = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    name: 'Invernadero Botánico Reforma',
    category: 'salon',
    address: 'Paseo de la Reforma 412, Col. Juárez, Ciudad de México',
    contact_name: 'Valeria Mendoza',
    contact_phone: '+52 55 4120 8890',
    contact_email: 'valeria@invernaderoevento.mx',
    latitude: 19.4270,
    longitude: -99.1677,
    capacity: 120,
    services: ['Decoración floral', 'Banquete', 'Iluminación arquitectónica', 'Mobiliario', 'Estacionamiento'],
    price: 48500,
    price_unit: 'por evento',
    available: true,
    availability_notes: 'Disponible viernes, sábados y domingos de temporada',
    description: 'Pabellón acristalado rodeado de vegetación natural ideal para bodas de día, cumpleaños íntimos y recepciones elegantes.',
    image_url: '/src/assets/images/venue_jardin_botanico_1795626919126.jpg',
    created_at: '2026-11-01T10:00:00.000Z',
    updated_at: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    name: 'Salón Imperial Polanco',
    category: 'salon',
    address: 'Av. Presidente Masaryk 280, Polanco, Ciudad de México',
    contact_name: 'Alejandro Ortega',
    contact_phone: '+52 55 5280 4410',
    contact_email: 'eventos@salonimperial.mx',
    latitude: 19.4319,
    longitude: -99.1935,
    capacity: 260,
    services: ['Banquete', 'Audio e iluminación', 'Decoración', 'Valet parking', 'Pista de baile'],
    price: 79000,
    price_unit: 'por evento',
    available: true,
    availability_notes: 'Fechas abiertas para el próximo trimestre',
    description: 'Gran salón contemporáneo de doble altura con candelabros escultóricos, acústica profesional y cocina industrial propia.',
    image_url: '/src/assets/images/venue_salon_imperial_1795626919437.jpg',
    created_at: '2026-11-02T10:00:00.000Z',
    updated_at: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    name: 'Terraza Mirador Condesa',
    category: 'salon',
    address: 'Av. Tamaulipas 145, Hipódromo Condesa, Ciudad de México',
    contact_name: 'Sofía Castellanos',
    contact_phone: '+52 55 6311 2094',
    contact_email: 'contacto@terrazamirador.mx',
    latitude: 19.4116,
    longitude: -99.1748,
    capacity: 90,
    services: ['Coctelería', 'DJ y sonido', 'Decoración lounge', 'Iluminación cálida'],
    price: 34000,
    price_unit: 'por evento',
    available: true,
    availability_notes: 'Disponible para eventos vespertinos y nocturnos',
    description: 'Azotea panorámica con vista al horizonte urbano, mobiliario lounge contemporáneo y barra de coctelería de autor.',
    image_url: '/src/assets/images/venue_terraza_mirador_1795626920246.jpg',
    created_at: '2026-11-03T10:00:00.000Z',
    updated_at: '2026-11-03T10:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    name: 'Hacienda Piedra Viva',
    category: 'salon',
    address: 'Calzada de Tlalpan 1890, Coyoacán, Ciudad de México',
    contact_name: 'Ricardo Domínguez',
    contact_phone: '+52 55 5658 7731',
    contact_email: 'reservas@haciendapiedraviva.mx',
    latitude: 19.3468,
    longitude: -99.1462,
    capacity: 180,
    services: ['Jardín', 'Banquete', 'Decoración rústica', 'Música en vivo', 'Coordinación'],
    price: 62000,
    price_unit: 'por evento',
    available: true,
    availability_notes: 'Disponible sábados y domingos todo el día',
    description: 'Patio histórico de cantera con arcos coloniales, olivos centenarios y mesas imperiales de roble para celebraciones al aire libre.',
    image_url: '/src/assets/images/venue_hacienda_piedra_1795626919633.jpg',
    created_at: '2026-11-04T10:00:00.000Z',
    updated_at: '2026-11-04T10:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0005-4000-8000-000000000005',
    name: 'Salón Roma Norte Loft',
    category: 'salon',
    address: 'Calle Colima 210, Roma Norte, Ciudad de México',
    contact_name: 'Camila Paredes',
    contact_phone: '+52 55 7092 1540',
    contact_email: 'hola@romaloft.mx',
    latitude: 19.4195,
    longitude: -99.1618,
    capacity: 85,
    services: ['Mobiliario', 'Audio profesional', 'Barra libre', 'Decoración temática'],
    price: 28500,
    price_unit: 'por evento',
    available: true,
    availability_notes: 'Disponible entre semana y fines de semana',
    description: 'Espacio versátil de arquitectura industrial renovada, perfecto para cumpleaños, aniversarios y lanzamientos de hasta 85 invitados.',
    image_url: '/src/assets/images/venue_terraza_mirador_1795626920246.jpg',
    created_at: '2026-11-05T10:00:00.000Z',
    updated_at: '2026-11-05T10:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0006-4000-8000-000000000006',
    name: 'Pabellón Chapultepec Jardín',
    category: 'salon',
    address: 'Av. Constituyentes 500, Bosque de Chapultepec, Ciudad de México',
    contact_name: 'Fernando Ibarra',
    contact_phone: '+52 55 5277 9012',
    contact_email: 'eventos@pabellonchapultepec.mx',
    latitude: 19.4131,
    longitude: -99.1984,
    capacity: 150,
    services: ['Jardín', 'Carpa transparente', 'Banquete', 'Estacionamiento'],
    price: 54000,
    price_unit: 'por evento',
    available: false,
    availability_notes: 'Reservado este mes; disponible a partir del próximo mes',
    description: 'Jardín arbolado con carpa estructural cristalina y terraza cubierta para bodas y graduaciones.',
    image_url: '/src/assets/images/venue_jardin_botanico_1795626919126.jpg',
    created_at: '2026-11-06T10:00:00.000Z',
    updated_at: '2026-11-06T10:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0007-4000-8000-000000000007',
    name: 'Atelier Flora & Mesa',
    category: 'proveedor',
    address: 'Calle Ámsterdam 88, Condesa, Ciudad de México',
    contact_name: 'Mariana Villalobos',
    contact_phone: '+52 55 8840 3122',
    contact_email: 'diseno@atelierflora.mx',
    latitude: 19.4128,
    longitude: -99.1699,
    capacity: 200,
    services: ['Decoración floral', 'Diseño de mesas', 'Centros de mesa', 'Iluminación decorativa', 'Ambientación'],
    price: 14500,
    price_unit: 'por paquete',
    available: true,
    availability_notes: 'Cobertura en toda la zona metropolitana',
    description: 'Estudio de diseño floral, montaje de mesas artesanales, velas y ambientación integral para cumpleaños, bodas y cenas.',
    image_url: '/src/assets/images/service_decoracion_catering_1795626921107.jpg',
    created_at: '2026-11-07T10:00:00.000Z',
    updated_at: '2026-11-07T10:00:00.000Z',
  },
  {
    id: 'a1b2c3d4-0008-4000-8000-000000000008',
    name: 'Sonido & Festín Producción',
    category: 'proveedor',
    address: 'Av. Insurgentes Sur 1240, Del Valle, Ciudad de México',
    contact_name: 'Diego Navarro',
    contact_phone: '+52 55 4419 6700',
    contact_email: 'produccion@sonidofestin.mx',
    latitude: 19.3761,
    longitude: -99.1774,
    capacity: 300,
    services: ['DJ y sonido', 'Banquete', 'Pastelería', 'Decoración con globos', 'Cabina fotográfica'],
    price: 18900,
    price_unit: 'por paquete',
    available: true,
    availability_notes: 'Disponible con 7 días de anticipación',
    description: 'Proveedor integral de producción para cumpleaños y celebraciones: audio profesional, catering de 3 tiempos, mesa de dulces y decoración.',
    image_url: '/src/assets/images/service_decoracion_catering_1795626921107.jpg',
    created_at: '2026-11-08T10:00:00.000Z',
    updated_at: '2026-11-08T10:00:00.000Z',
  },
];

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim())
  );
}

function readLocalStore(): VenueRecord[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_STORE_PATH)) {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(SEED_VENUES, null, 2), 'utf-8');
    return [...SEED_VENUES];
  }
  const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as VenueRecord[];
  return Array.isArray(parsed) ? parsed : [...SEED_VENUES];
}

function writeLocalStore(records: VenueRecord[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(records, null, 2), 'utf-8');
}

function sanitizeImageUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/src/assets/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }
  return '';
}

export function validateVenueInput(raw: Partial<VenueInput>): { ok: true; data: VenueInput } | { ok: false; error: string } {
  const name = String(raw.name ?? '').trim();
  const category = raw.category === 'proveedor' ? 'proveedor' : raw.category === 'salon' ? 'salon' : null;
  const address = String(raw.address ?? '').trim();
  const contact_name = String(raw.contact_name ?? '').trim();
  const contact_phone = String(raw.contact_phone ?? '').trim();
  const contact_email = String(raw.contact_email ?? '').trim();
  const latitude = Number(raw.latitude);
  const longitude = Number(raw.longitude);
  const capacity = Math.round(Number(raw.capacity ?? 0));
  const price = Number(raw.price ?? 0);
  const price_unit = String(raw.price_unit ?? 'por evento').trim() || 'por evento';
  const available = Boolean(raw.available ?? true);
  const availability_notes = String(raw.availability_notes ?? '').trim();
  const description = String(raw.description ?? '').trim();
  const image_url = sanitizeImageUrl(String(raw.image_url ?? ''));

  const services = Array.isArray(raw.services)
    ? raw.services.map((s) => String(s).trim()).filter(Boolean)
    : [];

  if (!name || name.length > 140) {
    return { ok: false, error: 'El nombre del salón o proveedor es obligatorio (máx. 140 caracteres).' };
  }
  if (!category) {
    return { ok: false, error: 'La categoría debe ser "salon" o "proveedor".' };
  }
  if (!address || address.length > 260) {
    return { ok: false, error: 'La dirección es obligatoria.' };
  }
  if (!contact_phone || contact_phone.length > 50) {
    return { ok: false, error: 'El teléfono de contacto es obligatorio.' };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { ok: false, error: 'La latitud debe ser un número válido entre -90 y 90.' };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, error: 'La longitud debe ser un número válido entre -180 y 180.' };
  }
  if (!Number.isFinite(capacity) || capacity < 0 || capacity > 50000) {
    return { ok: false, error: 'La capacidad debe ser un número entero positivo.' };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: 'El precio debe ser un valor numérico válido.' };
  }

  return {
    ok: true,
    data: {
      name,
      category,
      address,
      contact_name,
      contact_phone,
      contact_email,
      latitude,
      longitude,
      capacity,
      services,
      price,
      price_unit,
      available,
      availability_notes: availability_notes || (available ? 'Disponible bajo reserva' : 'Sin disponibilidad actual'),
      description,
      image_url:
        image_url ||
        (category === 'proveedor'
          ? '/src/assets/images/service_decoracion_catering_1795626921107.jpg'
          : '/src/assets/images/venue_salon_imperial_1795626919437.jpg'),
    },
  };
}

function applyFilters(records: VenueRecord[], filters: VenueFilters): VenueRecord[] {
  const q = filters.q?.trim().toLowerCase() ?? '';
  const serviceFilter = filters.service?.trim().toLowerCase() ?? '';
  const minCapacity = Number(filters.minCapacity ?? 0);

  return records.filter((item) => {
    if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }
    if (filters.availableOnly && !item.available) {
      return false;
    }
    if (Number.isFinite(minCapacity) && minCapacity > 0 && item.capacity < minCapacity) {
      return false;
    }
    if (serviceFilter && serviceFilter !== 'all') {
      const hasService = item.services.some((s) => s.toLowerCase().includes(serviceFilter));
      if (!hasService) return false;
    }
    if (q) {
      const haystack = [
        item.name,
        item.address,
        item.description,
        item.contact_name,
        ...item.services,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export async function listVenues(filters: VenueFilters = {}): Promise<{ records: VenueRecord[]; source: 'supabase' | 'local' }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al consultar Supabase: ${error.message}`);
    }
    const normalized = (data ?? []).map((row) => ({
      ...row,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      capacity: Number(row.capacity),
      price: Number(row.price),
      services: Array.isArray(row.services) ? row.services : [],
    })) as VenueRecord[];

    return { records: applyFilters(normalized, filters), source: 'supabase' };
  }

  const local = readLocalStore();
  return { records: applyFilters(local, filters), source: 'local' };
}

export async function createVenue(input: VenueInput): Promise<{ record: VenueRecord; source: 'supabase' | 'local' }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('venues')
      .insert([input])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al guardar en Supabase: ${error.message}`);
    }
    return { record: data as VenueRecord, source: 'supabase' };
  }

  const local = readLocalStore();
  const now = new Date().toISOString();
  const created: VenueRecord = {
    id: crypto.randomUUID(),
    ...input,
    created_at: now,
    updated_at: now,
  };
  local.unshift(created);
  writeLocalStore(local);
  return { record: created, source: 'local' };
}

export async function updateVenue(id: string, input: VenueInput): Promise<{ record: VenueRecord | null; source: 'supabase' | 'local' }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('venues')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Error al actualizar en Supabase: ${error.message}`);
    }
    return { record: (data as VenueRecord) ?? null, source: 'supabase' };
  }

  const local = readLocalStore();
  const idx = local.findIndex((item) => item.id === id);
  if (idx === -1) {
    return { record: null, source: 'local' };
  }
  const updated: VenueRecord = {
    ...local[idx],
    ...input,
    updated_at: new Date().toISOString(),
  };
  local[idx] = updated;
  writeLocalStore(local);
  return { record: updated, source: 'local' };
}

export async function deleteVenue(id: string): Promise<{ deleted: boolean; source: 'supabase' | 'local' }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error, count } = await supabase
      .from('venues')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar en Supabase: ${error.message}`);
    }
    return { deleted: (count ?? 0) > 0, source: 'supabase' };
  }

  const local = readLocalStore();
  const next = local.filter((item) => item.id !== id);
  if (next.length === local.length) {
    return { deleted: false, source: 'local' };
  }
  writeLocalStore(next);
  return { deleted: true, source: 'local' };
}
