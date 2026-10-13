export type PlateSize = "small" | "medium" | "large";

const PLATE_FACTORS: Record<PlateSize, number> = {
  small: 0.75,
  medium: 1,
  large: 1.25,
};

export function scaleByPlateSize(value: number, from: PlateSize, to: PlateSize) {
  return Math.max(0, Math.round(value * (PLATE_FACTORS[to] / PLATE_FACTORS[from])));
}

export function plateSizeFactor(size: PlateSize) {
  return PLATE_FACTORS[size];
}
