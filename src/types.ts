export type Need = 'hunger' | 'energy' | 'social' | 'hygiene' | 'fun' | 'bladder';

export interface SimStats {
  hunger: number;
  energy: number;
  social: number;
  hygiene: number;
  fun: number;
  bladder: number;
}

export interface Sim {
  name: string;
  stats: SimStats;
  position: { x: number; y: number };
  action: string | null;
  mood: string;
}

export interface GameObject {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  actions: string[];
}
