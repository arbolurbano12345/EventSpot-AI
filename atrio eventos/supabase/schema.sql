-- Esquema SQL para Supabase (PostgreSQL)
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('salon', 'proveedor')),
  address TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0 CHECK (capacity >= 0),
  services TEXT[] NOT NULL DEFAULT '{}',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  price_unit TEXT NOT NULL DEFAULT 'por evento',
  available BOOLEAN NOT NULL DEFAULT true,
  availability_notes TEXT NOT NULL DEFAULT 'Disponible fines de semana y entre semana',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas rápidas por capacidad, categoría y servicios
CREATE INDEX IF NOT EXISTS idx_venues_category ON public.venues (category);
CREATE INDEX IF NOT EXISTS idx_venues_capacity ON public.venues (capacity);
CREATE INDEX IF NOT EXISTS idx_venues_services ON public.venues USING GIN (services);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública para el catálogo y mapa
CREATE POLICY "Lectura pública de salones y proveedores"
  ON public.venues
  FOR SELECT
  USING (true);

-- Política de escritura desde el servidor con Service Role (o ajusta según autenticación)
CREATE POLICY "Gestión completa mediante rol autenticado o servicio"
  ON public.venues
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Datos iniciales de ejemplo (8 registros: 6 salones + 2 proveedores integrales)
INSERT INTO public.venues (
  name, category, address, contact_name, contact_phone, contact_email,
  latitude, longitude, capacity, services, price, price_unit,
  available, availability_notes, description, image_url
) VALUES
(
  'Invernadero Botánico Reforma',
  'salon',
  'Paseo de la Reforma 412, Col. Juárez, Ciudad de México',
  'Valeria Mendoza',
  '+52 55 4120 8890',
  'valeria@invernaderoevento.mx',
  19.4270, -99.1677,
  120,
  ARRAY['Decoración floral', 'Banquete', 'Iluminación arquitectónica', 'Mobiliario', 'Estacionamiento'],
  48500,
  'por evento',
  true,
  'Disponible viernes, sábados y domingos de temporada',
  'Pabellón acristalado rodeado de vegetación natural ideal para bodas de día, cumpleaños íntimos y recepciones elegantes.',
  '/src/assets/images/venue_jardin_botanico_1795626919126.jpg'
),
(
  'Salón Imperial Polanco',
  'salon',
  'Av. Presidente Masaryk 280, Polanco, Ciudad de México',
  'Alejandro Ortega',
  '+52 55 5280 4410',
  'eventos@salonimperial.mx',
  19.4319, -99.1935,
  260,
  ARRAY['Banquete', 'Audio e iluminación', 'Decoración', 'Valet parking', 'Pista de baile'],
  79000,
  'por evento',
  true,
  'Fechas abiertas para el próximo trimestre',
  'Gran salón contemporáneo de doble altura con candelabros escultóricos, acústica profesional y cocina industrial propia.',
  '/src/assets/images/venue_salon_imperial_1795626919437.jpg'
),
(
  'Terraza Mirador Condesa',
  'salon',
  'Av. Tamaulipas 145, Hipódromo Condesa, Ciudad de México',
  'Sofía Castellanos',
  '+52 55 6311 2094',
  'contacto@terrazamirador.mx',
  19.4116, -99.1748,
  90,
  ARRAY['Coctelería', 'DJ y sonido', 'Decoración lounge', 'Iluminación cálida'],
  34000,
  'por evento',
  true,
  'Disponible para eventos vespertinos y nocturnos',
  'Azotea panorámica con vista al horizonte urbano, mobiliario lounge contemporáneo y barra de coctelería de autor.',
  '/src/assets/images/venue_terraza_mirador_1795626920246.jpg'
),
(
  'Hacienda Piedra Viva',
  'salon',
  'Calzada de Tlalpan 1890, Coyoacán, Ciudad de México',
  'Ricardo Domínguez',
  '+52 55 5658 7731',
  'reservas@haciendapiedraviva.mx',
  19.3468, -99.1462,
  180,
  ARRAY['Jardín', 'Banquete', 'Decoración rústica', 'Música en vivo', 'Coordinación'],
  62000,
  'por evento',
  true,
  'Disponible sábados y domingos todo el día',
  'Patio histórico de cantera con arcos coloniales, olivos centenarios y mesas imperiales de roble para celebraciones al aire libre.',
  '/src/assets/images/venue_hacienda_piedra_1795626919633.jpg'
),
(
  'Salón Roma Norte Loft',
  'salon',
  'Calle Colima 210, Roma Norte, Ciudad de México',
  'Camila Paredes',
  '+52 55 7092 1540',
  'hola@romaloft.mx',
  19.4195, -99.1618,
  85,
  ARRAY['Mobiliario', 'Audio profesional', 'Barra libre', 'Decoración temática'],
  28500,
  'por evento',
  true,
  'Disponible entre semana y fines de semana',
  'Espacio versátil de arquitectura industrial renovada, perfecto para cumpleaños, aniversarios y lanzamientos de hasta 85 invitados.',
  '/src/assets/images/venue_terraza_mirador_1795626920246.jpg'
),
(
  'Pabellón Chapultepec Jardín',
  'salon',
  'Av. Constituyentes 500, Bosque de Chapultepec, Ciudad de México',
  'Fernando Ibarra',
  '+52 55 5277 9012',
  'eventos@pabellonchapultepec.mx',
  19.4131, -99.1984,
  150,
  ARRAY['Jardín', 'Carpa transparente', 'Banquete', 'Estacionamiento'],
  54000,
  'por evento',
  false,
  'Reservado este mes; disponible a partir del próximo mes',
  'Jardín arbolado con carpa estructural cristalina y terraza cubierta para bodas y graduaciones.',
  '/src/assets/images/venue_jardin_botanico_1795626919126.jpg'
),
(
  'Atelier Flora & Mesa',
  'proveedor',
  'Calle Ámsterdam 88, Condesa, Ciudad de México',
  'Mariana Villalobos',
  '+52 55 8840 3122',
  'diseño@atelierflora.mx',
  19.4128, -99.1699,
  200,
  ARRAY['Decoración floral', 'Diseño de mesas', 'Centros de mesa', 'Iluminación decorativa', 'Ambientación'],
  14500,
  'por paquete',
  true,
  'Cobertura en toda la zona metropolitana',
  'Estudio de diseño floral, montaje de mesas artesanales, velas y ambientación integral para cumpleaños, bodas y cenas.',
  '/src/assets/images/service_decoracion_catering_1795626921107.jpg'
),
(
  'Sonido & Festín Producción',
  'proveedor',
  'Av. Insurgentes Sur 1240, Del Valle, Ciudad de México',
  'Diego Navarro',
  '+52 55 4419 6700',
  'produccion@sonidofestin.mx',
  19.3761, -99.1774,
  300,
  ARRAY['DJ y sonido', 'Banquete', 'Pastelería', 'Decoración con globos', 'Cabina fotográfica'],
  18900,
  'por paquete',
  true,
  'Disponible con 7 días de anticipación',
  'Proveedor integral de producción para cumpleaños y celebraciones: audio profesional, catering de 3 tiempos, mesa de dulces y decoración.',
  '/src/assets/images/service_decoracion_catering_1795626921107.jpg'
);
