import type { CarKey, Vehicle, VisitReason } from './types';

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

// state series (MH12AB1234) and Bharat series (22BH1234AB)
export const REG_RE = /^([A-Za-z]{2}\s?\d{1,2}\s?[A-Za-z]{0,3}\s?\d{3,4}|\d{2}\s?BH\s?\d{4}\s?[A-Za-z]{1,2})$/i;
export const normReg = (s: string) => s.replace(/\s/g, '').toUpperCase();


export const VISIT_REASONS: { key: VisitReason; label: string; hint: string }[] = [
  { key: 'service', label: 'Regular service', hint: 'Periodic or requested work' },
  { key: 'repair', label: 'Problem or repair', hint: 'Customer reports an issue' },
  { key: 'accident', label: 'Accident or insurance', hint: 'Body damage or a claim' },
  { key: 'breakdown', label: 'Breakdown or towed', hint: 'Car cannot run' },
  { key: 'estimate', label: 'Estimate only', hint: 'Quote first, no repair yet' },
  { key: 'repeat', label: 'Repeat or warranty', hint: 'Came back after a job' },
];

/** What the customer feels, not the work to do. */
export const ISSUE_GROUPS: { area: string; issues: string[] }[] = [
  { area: 'Engine', issues: ['Will not start', 'Engine noise', 'Overheating', 'Smoke', 'Low pickup'] },
  { area: 'Brakes', issues: ['Brake noise', 'Weak braking', 'Soft pedal'] },
  { area: 'Suspension and steering', issues: ['Knocking sound', 'Pulls to one side', 'Hard steering'] },
  { area: 'AC', issues: ['AC not cooling', 'Bad smell from AC', 'AC noise'] },
  { area: 'Electrical', issues: ['Battery drain', 'Warning light on', 'Lights not working'] },
  { area: 'Leaks', issues: ['Oil leak', 'Coolant leak', 'High oil use'] },
];

export interface ServiceItem {
  label: string;
  type: 'Parts' | 'Labour' | 'Parts + Labour';
  price: number;
  cat: 'service' | 'brake' | 'ac' | 'body';
}

/** Sample price list. Staff can change the amount on each job. */
export const SERVICE_CATALOG: ServiceItem[] = [
  { label: 'Periodic service', type: 'Parts + Labour', price: 7000, cat: 'service' },
  { label: 'Engine oil change', type: 'Parts + Labour', price: 4500, cat: 'service' },
  { label: 'Suspension check', type: 'Labour', price: 800, cat: 'service' },
  { label: 'Brake check', type: 'Labour', price: 600, cat: 'brake' },
  { label: 'Brake pad replacement', type: 'Parts + Labour', price: 8500, cat: 'brake' },
  { label: 'AC service', type: 'Parts + Labour', price: 3200, cat: 'ac' },
  { label: 'Diagnostic scan', type: 'Labour', price: 1500, cat: 'service' },
  { label: 'Wheel alignment', type: 'Labour', price: 1200, cat: 'service' },
  { label: 'Wheel balancing', type: 'Labour', price: 900, cat: 'service' },
  { label: 'Battery replacement', type: 'Parts + Labour', price: 7500, cat: 'service' },
  { label: 'Car wash and detailing', type: 'Labour', price: 2500, cat: 'body' },
  { label: 'Panel repair and paint', type: 'Labour', price: 12000, cat: 'body' },
];

/** Tapping an issue suggests the check for it; staff still decide. */
export const ISSUE_SUGGESTS: Record<string, string> = {
  'Knocking sound': 'Suspension check', 'Pulls to one side': 'Wheel alignment', 'Hard steering': 'Suspension check',
  'Brake noise': 'Brake check', 'Weak braking': 'Brake check', 'Soft pedal': 'Brake check',
  'AC not cooling': 'AC service', 'Bad smell from AC': 'AC service', 'AC noise': 'AC service',
  'Warning light on': 'Diagnostic scan', 'Low pickup': 'Diagnostic scan', 'Engine noise': 'Diagnostic scan', 'Will not start': 'Diagnostic scan', 'Battery drain': 'Diagnostic scan',
};

export const INSPECTION_TASKS = ['Read the customer complaint', 'Inspect the car', 'Take photos of any issue', 'List the work needed'];
export const QUALITY_TASKS = ['Check all approved work is done', 'Road test the car', 'Clean the car', 'Final check and sign off'];

export const BELONGINGS = ['Spare wheel', 'Jack and tools', 'Stereo', 'Documents', 'Valuables', 'Spare key'];
export const FUEL_LEVELS = ['Empty', '1/4', '1/2', '3/4', 'Full'];
