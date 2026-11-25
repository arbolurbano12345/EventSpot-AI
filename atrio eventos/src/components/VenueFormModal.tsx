import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { VenueCategory, VenueInput, VenueRecord } from '../types/venue';

interface VenueFormModalProps {
  isOpen: boolean;
  editingVenue: VenueRecord | null;
  onClose: () => void;
  onSubmit: (data: VenueInput, editingId?: string) => Promise<void>;
}

const IMAGE_PRESETS = [
  { label: 'Invernadero Botánico', url: '/src/assets/images/venue_jardin_botanico_1795626919126.jpg' },
  { label: 'Salón Imperial', url: '/src/assets/images/venue_salon_imperial_1795626919437.jpg' },
  { label: 'Terraza Mirador', url: '/src/assets/images/venue_terraza_mirador_1795626920246.jpg' },
  { label: 'Hacienda de Piedra', url: '/src/assets/images/venue_hacienda_piedra_1795626919633.jpg' },
  { label: 'Decoración y Banquete', url: '/src/assets/images/service_decoracion_catering_1795626921107.jpg' },
];

const COORDINATE_PRESETS = [
  { label: 'Reforma / Juárez', lat: 19.4270, lng: -99.1677 },
  { label: 'Polanco', lat: 19.4319, lng: -99.1935 },
  { label: 'Condesa', lat: 19.4116, lng: -99.1748 },
  { label: 'Roma Norte', lat: 19.4195, lng: -99.1618 },
  { label: 'Coyoacán', lat: 19.3468, lng: -99.1462 },
  { label: 'Santa Fe', lat: 19.3659, lng: -99.2618 },
];

const COMMON_SERVICES = [
  'Decoración floral',
  'Decoración temática',
  'Banquete',
  'DJ y sonido',
  'Iluminación',
  'Jardín',
  'Mobiliario',
  'Pastelería',
  'Estacionamiento',
  'Coctelería',
];

export function VenueFormModal({
  isOpen,
  editingVenue,
  onClose,
  onSubmit,
}: VenueFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VenueCategory>('salon');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [latitude, setLatitude] = useState('19.4220');
  const [longitude, setLongitude] = useState('-99.1700');
  const [capacity, setCapacity] = useState('100');
  const [price, setPrice] = useState('35000');
  const [priceUnit, setPriceUnit] = useState('por evento');
  const [servicesText, setServicesText] = useState('Decoración, Banquete, Iluminación');
  const [available, setAvailable] = useState(true);
  const [availabilityNotes, setAvailabilityNotes] = useState('Disponible fines de semana');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(IMAGE_PRESETS[0].url);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingVenue) {
      setName(editingVenue.name);
      setCategory(editingVenue.category);
      setAddress(editingVenue.address);
      setContactName(editingVenue.contact_name);
      setContactPhone(editingVenue.contact_phone);
      setContactEmail(editingVenue.contact_email);
      setLatitude(String(editingVenue.latitude));
      setLongitude(String(editingVenue.longitude));
      setCapacity(String(editingVenue.capacity));
      setPrice(String(editingVenue.price));
      setPriceUnit(editingVenue.price_unit);
      setServicesText(editingVenue.services.join(', '));
      setAvailable(editingVenue.available);
      setAvailabilityNotes(editingVenue.availability_notes);
      setDescription(editingVenue.description);
      setImageUrl(editingVenue.image_url || IMAGE_PRESETS[0].url);
    } else {
      setName('');
      setCategory('salon');
      setAddress('');
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setLatitude('19.4220');
      setLongitude('-99.1700');
      setCapacity('100');
      setPrice('35000');
      setPriceUnit('por evento');
      setServicesText('Decoración, Banquete, Iluminación');
      setAvailable(true);
      setAvailabilityNotes('Disponible fines de semana y entre semana');
      setDescription('');
      setImageUrl(IMAGE_PRESETS[0].url);
    }
  }, [isOpen, editingVenue]);

  if (!isOpen) return null;

  const toggleServiceChip = (service: string) => {
    const current = servicesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = current.some((s) => s.toLowerCase() === service.toLowerCase());
    if (exists) {
      setServicesText(current.filter((s) => s.toLowerCase() !== service.toLowerCase()).join(', '));
    } else {
      setServicesText([...current, service].join(', '));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const services = servicesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: VenueInput = {
      name: name.trim(),
      category,
      address: address.trim(),
      contact_name: contactName.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      capacity: Number(capacity),
      services,
      price: Number(price),
      price_unit: priceUnit.trim() || 'por evento',
      available,
      availability_notes: availabilityNotes.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
    };

    try {
      setSubmitting(true);
      await onSubmit(payload, editingVenue?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el registro');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 id="venue-modal-title" className="text-lg font-semibold text-slate-900">
            {editingVenue ? 'Modificar registro' : 'Nuevo salón o proveedor'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="px-4 py-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Nombre del salón o proveedor *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Jardín Santa María"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Tipo de registro *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VenueCategory)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
              >
                <option value="salon">Salón de eventos</option>
                <option value="proveedor">Proveedor de servicios</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Dirección completa *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, colonia, ciudad"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
            />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-700">
                Coordenadas geográficas (OpenStreetMap &amp; Google Maps)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COORDINATE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setLatitude(String(preset.lat));
                      setLongitude(String(preset.lng));
                    }}
                    className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:border-[#0F766E] rounded-md transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Latitud *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Longitud *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Capacidad (invitados) *
              </label>
              <input
                type="number"
                min={0}
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Precio (MXN) *
              </label>
              <input
                type="number"
                min={0}
                step="any"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Modalidad de cobro
              </label>
              <select
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
              >
                <option value="por evento">por evento</option>
                <option value="por paquete">por paquete</option>
                <option value="por persona">por persona</option>
                <option value="por hora">por hora</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Persona de contacto
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ej. Laura Gómez"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Teléfono *
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+52 55 0000 0000"
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contacto@salon.mx"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Servicios incluidos (separados por coma)
            </label>
            <input
              type="text"
              value={servicesText}
              onChange={(e) => setServicesText(e.target.value)}
              placeholder="Decoración floral, Banquete, Iluminación..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_SERVICES.map((srv) => {
                const active = servicesText.toLowerCase().includes(srv.toLowerCase());
                return (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => toggleServiceChip(srv)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      active
                        ? 'bg-[#0F766E] text-white border-[#0F766E]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {srv}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Disponibilidad
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setAvailable(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    available
                      ? 'bg-[#0F766E] text-white border-[#0F766E]'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Disponible
                </button>
                <button
                  type="button"
                  onClick={() => setAvailable(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    !available
                      ? 'bg-amber-700 text-white border-amber-700'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Reservado
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Fotografía del catálogo
              </label>
              <select
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
              >
                {IMAGE_PRESETS.map((preset) => (
                  <option key={preset.label} value={preset.url}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Notas de disponibilidad y descripción
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el ambiente, tipo de eventos recomendados o detalles importantes..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-[#0F766E] hover:bg-[#0D625B] rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? 'Guardando...' : editingVenue ? 'Guardar cambios' : 'Registrar en catálogo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
