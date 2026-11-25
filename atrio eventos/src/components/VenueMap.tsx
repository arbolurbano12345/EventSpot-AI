import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, Copy, Download, ExternalLink, MapPin, Navigation, Phone, Users } from 'lucide-react';
import type { VenueRecord } from '../types/venue';
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsMultiRouteUrl,
  buildGoogleMapsPlaceUrl,
  formatMxn,
} from '../utils/maps';

interface VenueMapProps {
  venues: VenueRecord[];
  selectedVenue: VenueRecord | null;
  onSelectVenue: (venue: VenueRecord) => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createMarkerIcon(category: 'salon' | 'proveedor', isSelected: boolean): L.DivIcon {
  const fill = category === 'salon' ? '#0F766E' : '#B45309';
  const size = isSelected ? 34 : 28;
  const ring = isSelected ? 'box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.25);' : 'box-shadow: 0 3px 10px rgba(15, 23, 42, 0.25);';

  return L.divIcon({
    className: 'custom-osm-pin',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:2.5px solid #FFFFFF;${ring}display:flex;align-items:center;justify-content:center;color:#FFFFFF;font-family:Plus Jakarta Sans,sans-serif;font-size:12px;font-weight:700;">${
      category === 'salon' ? 'S' : 'P'
    }</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function VenueMap({ venues, selectedVenue, onSelectVenue }: VenueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [19.415, -99.17],
      zoom: 12,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      markerMapRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markerMapRef.current.clear();

    const bounds: L.LatLngTuple[] = [];

    venues.forEach((venue) => {
      const isSelected = selectedVenue?.id === venue.id;
      const marker = L.marker([venue.latitude, venue.longitude], {
        icon: createMarkerIcon(venue.category, isSelected),
      });

      const googleUrl = buildGoogleMapsPlaceUrl(venue.latitude, venue.longitude);
      const dirUrl = buildGoogleMapsDirectionsUrl(venue.latitude, venue.longitude);
      const safeName = escapeHtml(venue.name);
      const safeAddress = escapeHtml(venue.address);
      const safeCategory = venue.category === 'salon' ? 'Salón de eventos' : 'Proveedor';

      marker.bindPopup(`
        <div style="padding:14px;font-family:DM Sans,sans-serif;color:#0F172A;">
          <div style="font-size:11px;color:#475569;margin-bottom:4px;">${safeCategory} · ${venue.capacity} inv. · ${formatMxn(venue.price)}</div>
          <div style="font-size:15px;font-weight:700;margin-bottom:4px;line-height:1.25;">${safeName}</div>
          <div style="font-size:12px;color:#64748B;margin-bottom:10px;line-height:1.35;">${safeAddress}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="${googleUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:8px;background:#0F766E;color:#FFFFFF;font-size:12px;font-weight:600;text-decoration:none;">
              Ver en Google Maps
            </a>
            <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;border-radius:8px;background:#F1F5F9;color:#0F172A;font-size:12px;font-weight:500;text-decoration:none;">
              Cómo llegar
            </a>
          </div>
        </div>
      `);

      marker.on('click', () => {
        onSelectVenue(venue);
      });

      marker.addTo(layer);
      markerMapRef.current.set(venue.id, marker);
      bounds.push([venue.latitude, venue.longitude]);
    });

    if (bounds.length > 0 && !selectedVenue) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [venues, selectedVenue, onSelectVenue]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedVenue) return;

    map.flyTo([selectedVenue.latitude, selectedVenue.longitude], 14, {
      duration: 0.65,
    });

    const marker = markerMapRef.current.get(selectedVenue.id);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedVenue]);

  const handleCopyCoords = async (venue: VenueRecord) => {
    const text = `${venue.latitude}, ${venue.longitude}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(venue.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  const activeVenue = selectedVenue ?? venues[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0F766E] inline-block" aria-hidden="true" />
            Salones de eventos (S)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#B45309] inline-block" aria-hidden="true" />
            Proveedores de servicios (P)
          </span>
          <span className="text-slate-400">|</span>
          <span className="font-mono tabular-nums">{venues.length} ubicaciones en mapa</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={buildGoogleMapsMultiRouteUrl(venues)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#0F766E] hover:bg-[#0D625B] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            Ver ruta en Google Maps
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="/api/venues/export/kml"
            download="atrio-eventos-ubicaciones.kml"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Exportar KML (Google My Maps)
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[420px] lg:min-h-[480px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[420px] lg:min-h-[480px]" />
        </div>

        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          {activeVenue ? (
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                <span className="font-medium text-slate-800">
                  {activeVenue.category === 'salon' ? 'Salón seleccionado' : 'Proveedor seleccionado'}
                </span>
                <span className={activeVenue.available ? 'text-[#0F766E] font-medium' : 'text-amber-700 font-medium'}>
                  {activeVenue.available ? 'Disponible' : 'Reservado'}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 leading-snug">
                {activeVenue.name}
              </h3>

              <p className="text-sm text-slate-600 mt-2">{activeVenue.description}</p>

              <dl className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <dd className="text-slate-700">{activeVenue.address}</dd>
                </div>
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <dd className="text-slate-700 font-mono tabular-nums">
                    Capacidad: {activeVenue.capacity} invitados
                  </dd>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <dd className="text-slate-700">
                    {activeVenue.contact_name ? `${activeVenue.contact_name} · ` : ''}
                    <span className="font-mono tabular-nums">{activeVenue.contact_phone}</span>
                  </dd>
                </div>
              </dl>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1.5">Servicios incluidos</p>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {activeVenue.services.join(' · ')}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Tarifa estimada</span>
                <div>
                  <span className="text-lg font-semibold text-slate-900 font-mono tabular-nums">
                    {formatMxn(activeVenue.price)}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">{activeVenue.price_unit}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-8 text-center">
              Selecciona un marcador en OpenStreetMap para ver los detalles de la ubicación.
            </div>
          )}

          {activeVenue && (
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono tabular-nums">
                  {activeVenue.latitude.toFixed(5)}, {activeVenue.longitude.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCoords(activeVenue)}
                  className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium"
                >
                  {copiedId === activeVenue.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                      Copiadas
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar coords
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={buildGoogleMapsPlaceUrl(activeVenue.latitude, activeVenue.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#0F766E] hover:bg-[#0D625B] rounded-lg transition-colors whitespace-nowrap"
                >
                  Ver en Google Maps
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={buildGoogleMapsDirectionsUrl(activeVenue.latitude, activeVenue.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Cómo llegar
                  <Navigation className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
