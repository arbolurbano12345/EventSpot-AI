export type VenueCategory = 'salon' | 'proveedor';

export interface VenueRecord {
  id: string;
  name: string;
  category: VenueCategory;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  latitude: number;
  longitude: number;
  capacity: number;
  services: string[];
  price: number;
  price_unit: string;
  available: boolean;
  availability_notes: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface VenueInput {
  name: string;
  category: VenueCategory;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  latitude: number;
  longitude: number;
  capacity: number;
  services: string[];
  price: number;
  price_unit: string;
  available: boolean;
  availability_notes: string;
  description: string;
  image_url: string;
}

export interface VenueFilters {
  q?: string;
  category?: 'all' | VenueCategory;
  minCapacity?: number;
  service?: string;
  availableOnly?: boolean;
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
  referencedVenues?: VenueRecord[];
}
