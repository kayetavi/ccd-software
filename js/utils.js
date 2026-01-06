export function tempBand(temp) {
  if (temp <= 120) return { band: "LOW", min: 0, max: 120 };
  if (temp <= 260) return { band: "MEDIUM", min: 121, max: 260 };
  return { band: "HIGH", min: 261, max: 1000 };
}
