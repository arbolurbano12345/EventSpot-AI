import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { AssistantPanel } from './components/AssistantPanel';
import { VenueCard } from './components/VenueCard';
import { VenueFormModal } from './components/VenueFormModal';
import { VenueMap } from './components/VenueMap';
import type { VenueCategory, VenueInput, VenueRecord } from './types/venue';

interface HealthStatus {
  storageMode: 'supabase' | 'local';
  supabaseConfigured: boolean;
  geminiConfigured: boolean;
}

export default function App() {
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus>({
    storageMode: 'local',
    supabaseConfigured: false,
    geminiConfigured: true,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | VenueCategory>('all');
  const [minCapacityFilter, setMinCapacityFilter] = useState<number>(0);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Map & Modal State
  const [selectedVenue, setSelectedVenue] = useState<VenueRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueRecord | null>(null);

  const loadVenues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [venuesRes, healthRes] = await Promise.all([
        fetch('/api/venues'),
        fetch('/api/health'),
      ]);
      if (!venuesRes.ok) {
        const errBody = await venuesRes.json().catch(() => ({}));
        throw new Error(errBody.error || 'No se pudo cargar el catálogo');
      }
      const venuesData = await venuesRes.json();
      setVenues(Array.isArray(venuesData.records) ? venuesData.records : []);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth({
          storageMode: healthData.storageMode === 'supabase' ? 'supabase' : 'local',
          supabaseConfigured: Boolean(healthData.supabaseConfigured),
          geminiConfigured: Boolean(healthData.geminiConfigured),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red al consultar registros');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const allServices = useMemo(() => {
    const set = new Set<string>();
    venues.forEach((v) => v.services.forEach((s) => set.add(s)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [venues]);

  const filteredVenues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return venues.filter((v) => {
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (availableOnly && !v.available) return false;
      if (minCapacityFilter > 0 && v.capacity < minCapacityFilter) return false;
      if (serviceFilter !== 'all') {
        const match = v.services.some((s) => s.toLowerCase().includes(serviceFilter.toLowerCase()));
        if (!match) return false;
      }
      if (q) {
        const haystack = [v.name, v.address, v.description, v.contact_name, ...v.services]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [venues, searchQuery, categoryFilter, availableOnly, minCapacityFilter, serviceFilter]);

  const stats = useMemo(() => {
    const salones = venues.filter((v) => v.category === 'salon');
    const disponibles = salones.filter((v) => v.available).length;
    const maxCap = venues.reduce((max, v) => Math.max(max, v.capacity), 0);
    const proveedores = venues.filter((v) => v.category === 'proveedor').length;
    return {
      total: venues.length,
      salonesDisponibles: disponibles,
      maxCap,
      proveedores,
    };
  }, [venues]);

  const handleSaveVenue = async (data: VenueInput, editingId?: string) => {
    const url = editingId ? `/api/venues/${editingId}` : '/api/venues';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || 'Error al guardar el registro');
    }

    await loadVenues();
    if (body.record) {
      setSelectedVenue(body.record);
    }
  };

  const handleDeleteVenue = async (id: string) => {
    const res = await fetch(`/api/venues/${id}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || 'No se pudo eliminar el registro');
      return;
    }
    if (selectedVenue?.id === id) {
      setSelectedVenue(null);
    }
    await loadVenues();
  };

  const handleSelectOnMap = (venue: VenueRecord) => {
    setSelectedVenue(venue);
    const el = document.getElementById('mapa');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openCreateModal = () => {
    setEditingVenue(null);
    setIsModalOpen(true);
  };

  const openEditModal = (venue: VenueRecord) => {
    setEditingVenue(venue);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setMinCapacityFilter(0);
    setServiceFilter('all');
    setAvailableOnly(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Atrio Eventos
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#catalogo"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Catálogo
            </a>
            <a
              href="#mapa"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Mapa
            </a>
            <a
              href="#asistente"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Asistente IA
            </a>
            <a
              href="#despliegue"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Despliegue
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#0F766E] hover:bg-[#0D625B] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo registro
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Split Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center py-2">
              <p className="text-xs font-medium text-[#0F766E] mb-3">
                Directorio interactivo para celebraciones
              </p>
              <h1
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 tracking-tight leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                Salones y proveedores para celebraciones inolvidables
              </h1>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
                Administra espacios, capacidades, servicios y disponibilidad en tiempo real. Explora
                ubicaciones en OpenStreetMap, expórtalas a Google Maps y consulta al asistente
                inteligente sobre el catálogo real.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#catalogo"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  Explorar catálogo
                </a>
                <a
                  href="#asistente"
                  className="px-5 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  Consultar asistente IA
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[260px] lg:min-h-[340px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src="/src/assets/images/venue_jardin_botanico_1795626919126.jpg"
                  alt="Salón invernadero preparado para una celebración"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 4-column summary strip directly below hero split */}
          <div className="mt-8 bg-white border border-slate-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="px-6 py-4">
              <p className="text-xs text-slate-500">Registros en catálogo</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                {stats.total}
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-slate-500">Salones disponibles</p>
              <p className="mt-1 text-2xl font-semibold text-[#0F766E] font-mono tabular-nums">
                {stats.salonesDisponibles}
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-slate-500">Capacidad máxima</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                {stats.maxCap} inv.
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-slate-500">Proveedores activos</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                {stats.proveedores}
              </p>
            </div>
          </div>
        </section>

        {/* Catalog & CRUD Section */}
        <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Catálogo de salones y servicios
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Filtra por capacidad de invitados, tipo de servicio o disponibilidad y gestiona cada
                registro.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-[#0F766E]" />
              Agregar salón o proveedor
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, zona, servicio..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  aria-label="Filtrar por capacidad mínima"
                  value={minCapacityFilter}
                  onChange={(e) => setMinCapacityFilter(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                >
                  <option value={0}>Cualquier capacidad</option>
                  <option value={50}>50+ invitados</option>
                  <option value={80}>80+ invitados</option>
                  <option value={120}>120+ invitados</option>
                  <option value={200}>200+ invitados</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <select
                  aria-label="Filtrar por tipo de servicio"
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                >
                  <option value="all">Todos los servicios</option>
                  <option value="Decoración">Decoración (cualquier tipo)</option>
                  {allServices.map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { key: 'all', label: 'Todos' },
                    { key: 'salon', label: 'Salones' },
                    { key: 'proveedor', label: 'Proveedores' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setCategoryFilter(tab.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      categoryFilter === tab.key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  Solo disponibles
                </label>

                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {filteredVenues.length} de {venues.length}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={loadVenues}
                className="text-xs font-medium underline hover:no-underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-1/2 bg-slate-200 rounded" />
                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                    <div className="h-4 w-full bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-base font-medium text-slate-900">
                No hay registros que coincidan con los filtros actuales
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Prueba ajustando la capacidad mínima o agrega un nuevo salón al catálogo.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Limpiar filtros
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#0F766E] hover:bg-[#0D625B] rounded-lg transition-colors"
                >
                  Nuevo registro
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  isSelected={selectedVenue?.id === venue.id}
                  onSelectOnMap={handleSelectOnMap}
                  onEdit={openEditModal}
                  onDelete={handleDeleteVenue}
                />
              ))}
            </div>
          )}
        </section>

        {/* Interactive OpenStreetMap + Google Maps Export Section */}
        <section id="mapa" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Mapa interactivo en OpenStreetMap y exportación a Google Maps
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Selecciona cualquier marcador en OpenStreetMap para inspeccionar su información o abre
              las ubicaciones directamente en Google Maps y Google My Maps.
            </p>
          </div>

          <VenueMap
            venues={filteredVenues}
            selectedVenue={selectedVenue}
            onSelectVenue={setSelectedVenue}
          />
        </section>

        {/* Gemini AI Assistant Section */}
        <section id="asistente" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Asistente inteligente con datos reales
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Respuestas dinámicas impulsadas por Gemini sobre las capacidades, precios y servicios
              registrados en la base de datos.
            </p>
          </div>

          <AssistantPanel
            onSelectVenueOnMap={handleSelectOnMap}
            totalRecords={venues.length}
          />
        </section>

        {/* Architecture & Deployment (Supabase + GitHub + Render) */}
        <section id="despliegue" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Arquitectura y publicación en Supabase, GitHub y Render
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Estructura lista para producción con variables de entorno protegidas en el servidor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <p className="text-xs font-medium text-[#0F766E] mb-1">01. Base de datos</p>
              <h3 className="text-base font-semibold text-slate-900">Supabase PostgreSQL</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                El esquema completo y los registros iniciales están listos en{' '}
                <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  supabase/schema.sql
                </code>
                . Al definir <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">SUPABASE_URL</code> y{' '}
                <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code>,
                el servidor opera directamente contra PostgreSQL.
              </p>
              <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Modo actual:{' '}
                <span className="font-medium text-slate-900">
                  {health.storageMode === 'supabase'
                    ? 'Conectado a Supabase'
                    : 'Almacenamiento local persistente activo'}
                </span>
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <p className="text-xs font-medium text-[#0F766E] mb-1">02. Repositorio y hosting</p>
              <h3 className="text-base font-semibold text-slate-900">GitHub y Render</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Incluye el archivo{' '}
                <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  render.yaml
                </code>{' '}
                para desplegar automáticamente desde GitHub como servicio web Node.js con{' '}
                <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  npm run build
                </code>{' '}
                y{' '}
                <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  npm start
                </code>
                .
              </p>
              <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Claves protegidas mediante variables de entorno del servidor.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <p className="text-xs font-medium text-[#0F766E] mb-1">03. Cartografía e IA</p>
              <h3 className="text-base font-semibold text-slate-900">OpenStreetMap y Google Maps</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Mapa interactivo con teselas de OpenStreetMap y exportación inmediata a Google Maps
                por marcador, ruta multipunto y archivo{' '}
                <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">.kml</code>{' '}
                para Google My Maps.
              </p>
              <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Asistente Gemini:{' '}
                <span className="font-medium text-slate-900">
                  {health.geminiConfigured ? 'Activo en servidor' : 'Pendiente de clave en entorno'}
                </span>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>Atrio Eventos — Sistema de gestión de salones y proveedores para celebraciones</span>
          <div className="flex items-center gap-6">
            <a href="#catalogo" className="hover:text-slate-900 transition-colors">
              Catálogo
            </a>
            <a href="#mapa" className="hover:text-slate-900 transition-colors">
              OpenStreetMap
            </a>
            <a href="/api/venues/export/kml" className="hover:text-slate-900 transition-colors">
              Exportar KML
            </a>
          </div>
        </div>
      </footer>

      <VenueFormModal
        isOpen={isModalOpen}
        editingVenue={editingVenue}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveVenue}
      />
    </div>
  );
}
