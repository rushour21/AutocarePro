import type { CarKey, Vehicle } from './types';

export interface ModelPreset {
  key: string;
  make: string;
  model: string;
  variant: string;
  fuel: Vehicle['fuel'];
  carKey: CarKey;
}

/** Vehicles we ship an illustration for; used by the quick-pick in Add Vehicle and the New Job wizard. */
export const MODELS: ModelPreset[] = [
  { key: 'bmw3', make: 'BMW', model: '3 Series', variant: '330i M Sport', fuel: 'Petrol', carKey: 'bmw3' },
  { key: 'audiq5', make: 'Audi', model: 'Q5', variant: '2.0 TFSI', fuel: 'Petrol', carKey: 'audiq5' },
  { key: 'glc', make: 'Mercedes', model: 'GLC', variant: '300 4MATIC', fuel: 'Petrol', carKey: 'glc' },
  { key: 'fortuner', make: 'Toyota', model: 'Fortuner', variant: '2.8 Diesel', fuel: 'Diesel', carKey: 'fortuner' },
  { key: 'bmwx5', make: 'BMW', model: 'X5', variant: 'xDrive30d', fuel: 'Diesel', carKey: 'bmwx5' },
  { key: 'rangerover', make: 'Range Rover', model: 'Sport', variant: '3.0 D', fuel: 'Diesel', carKey: 'rangerover' },
];

/** Picture shown for a vehicle that has no dedicated illustration. */
export const BODY_STYLES: { carKey: CarKey; label: string }[] = [
  { carKey: 'bmw3', label: 'Sedan (white)' },
  { carKey: 'audiq5', label: 'SUV (black)' },
  { carKey: 'glc', label: 'SUV (silver)' },
  { carKey: 'fortuner', label: 'Large SUV (black)' },
  { carKey: 'bmwx5', label: 'Premium SUV' },
  { carKey: 'rangerover', label: 'Luxury SUV' },
];

export const REG_RE = /^[A-Za-z]{2}\s?\d{1,2}\s?[A-Za-z]{1,3}\s?\d{3,4}$/;
export const normReg = (s: string) => s.replace(/\s/g, '').toUpperCase();
