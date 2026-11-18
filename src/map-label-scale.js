// A zoom level of one is the map's initial framing, independent of viewport size.
// Approach the regular glyph size at close range and give overview labels more room.
export function mapLabelScale(zoom) {
  return Math.min(1.5, 1 + 0.33 * Math.log2(1 + 1 / zoom));
}
