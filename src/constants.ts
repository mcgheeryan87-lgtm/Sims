export const DECAY_RATES = {
  hunger: 0.1,
  energy: 0.05,
  social: 0.08,
  hygiene: 0.06,
  fun: 0.12,
  bladder: 0.07,
};

export const REPLENISH_RATES = {
  eating: { hunger: 0.5 },
  sleeping: { energy: 0.8 },
  showering: { hygiene: 1.0, bladder: -0.1 },
  chatting: { social: 0.6 },
  gaming: { fun: 0.7, energy: -0.05 },
  bathroom: { bladder: 1.0 },
};

export const GRID_SIZE = 10;
export const TILE_SIZE = 60;
