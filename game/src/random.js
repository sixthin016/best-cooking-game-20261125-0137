// A tiny seeded RNG (mulberry32) so a ?seed=N run always plays the same orders and
// the same screenshot scenes. The game never uses Math.random for gameplay.
/** Make a random function seeded by a 32-bit integer. */
export function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `items` with the seeded random. */
export function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}

/** An integer in [min, max] from the seeded random. */
export function intBetween(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
