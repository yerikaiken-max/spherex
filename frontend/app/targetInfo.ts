export interface Measured { value: number | null; unit: string; source: string }
export interface TargetInfo {
  radius: Measured;
  rotationPeriod: Measured;
  properMotion: Measured;
  atmosphere: string;
}
const empty = (unit: string): Measured => ({ value: null, unit, source: "" });
const blank: TargetInfo = {
  radius: empty("R☉"),
  rotationPeriod: empty("hours"),
  properMotion: empty("arcsec/yr"),
  atmosphere: "",
};
export const TARGET_INFO: Record<string, TargetInfo> = {
  "WISE 0855": blank,
  "Barnard's Star": blank,
  "Epsilon Indi B": blank,
  "RW Aurigae": blank,
  "R Draconis": blank,
};
