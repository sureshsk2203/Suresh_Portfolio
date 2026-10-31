export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const ease = (t: number) => t * t * (3 - 2 * t);
/** smoothstep of x between a and b */
export const smooth = (x: number, a: number, b: number) => ease(clamp((x - a) / (b - a), 0, 1));
