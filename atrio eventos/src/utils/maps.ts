import type { VenueRecord } from '../types/venue';

export function buildGoogleMapsPlaceUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function buildGoogleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}

export function buildGoogleMapsMultiRouteUrl(venues: VenueRecord[]): string {
  const subset = venues.slice(0, 10);
  if (subset.length === 0) {
    return 'https://www.google.com/maps';
  }
  if (subset.length === 1) {
    return buildGoogleMapsPlaceUrl(subset[0].latitude, subset[0].longitude);
  }
  const segments = subset.map((v) => `${v.latitude},${v.longitude}`).join('/');
  return `https://www.google.com/maps/dir/${segments}`;
}

export function formatMxn(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(price);
}
