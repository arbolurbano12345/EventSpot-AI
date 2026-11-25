import { useState } from 'react';
import { ExternalLink, MapPin, Pencil, Trash2, Users } from 'lucide-react';
import type { VenueRecord } from '../types/venue';
import { buildGoogleMapsPlaceUrl, formatMxn } from '../utils/maps';

interface VenueCardProps {
  venue: VenueRecord;
  isSelected: boolean;
  onSelectOnMap: (venue: VenueRecord) => void;
  onEdit: (venue: VenueRecord) => void;
  onDelete: (id: string) => Promise<void>;
}

export function VenueCard({
  venue,
  isSelected,
  onSelectOnMap,
  onEdit,
  onDelete,
}: VenueCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await onDelete(venue.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <article
      className={`group flex flex-col bg-white border transition-all duration-200 rounded-xl overflow-hidden ${
        isSelected
          ? 'border-[#0F766E] shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-sm'
      }`}
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        {!imgError && venue.image_url ? (
          <img
            src={venue.image_url}
            alt={venue.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 px-4 text-center">
            <MapPin className="w-7 h-7 mb-2 text-slate-400" />
            <span className="text-sm font-medium text-slate-700 line-clamp-1">{venue.name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
          <span className="font-medium text-slate-700">
            {venue.category === 'salon' ? 'Salón de eventos' : 'Proveedor'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {venue.capacity} inv.
          </span>
          <span aria-hidden="true">·</span>
          <span className={venue.available ? 'text-[#0F766E] font-medium' : 'text-amber-700 font-medium'}>
            {venue.available ? 'Disponible' : 'Reservado'}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 leading-snug line-clamp-1">
          {venue.name}
        </h3>

        <p className="text-sm text-slate-600 mt-1 line-clamp-2 min-h-[2.5rem]">
          {venue.description || venue.address}
        </p>

        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
          <p className="line-clamp-1 text-slate-500">{venue.address}</p>
          <p className="line-clamp-1 text-slate-700">
            <span className="text-slate-400">Servicios: </span>
            {venue.services.length > 0 ? venue.services.join(' · ') : 'Sin especificar'}
          </p>
          <p className="text-slate-500">
            <span className="text-slate-400">Contacto: </span>
            {venue.contact_name ? `${venue.contact_name} · ` : ''}
            <span className="font-mono tabular-nums">{venue.contact_phone}</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between gap-2">
          <div>
            <span className="text-base font-semibold text-slate-900 font-mono tabular-nums">
              {formatMxn(venue.price)}
            </span>
            <span className="text-xs text-slate-500 ml-1.5">{venue.price_unit}</span>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-slate-400">
            {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
          </span>
        </div>

        {confirmDelete ? (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-rose-50/70 -mx-5 -mb-5 px-5 py-3">
            <span className="text-xs font-medium text-rose-900">¿Eliminar registro?</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-700 rounded-lg hover:bg-rose-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                {deleting ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectOnMap(venue)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                Ver en mapa
              </button>
              <a
                href={buildGoogleMapsPlaceUrl(venue.latitude, venue.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F766E] bg-[#0F766E]/8 hover:bg-[#0F766E]/15 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(venue)}
                aria-label={`Editar ${venue.name}`}
                title="Editar registro"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label={`Eliminar ${venue.name}`}
                title="Eliminar registro"
                className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
