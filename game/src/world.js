// The kitchen simulation: one chef, one shift, a board full of tickets. Everything
// the game shows comes from this state; the renderer only paints it.
//
// The loop a ticket takes through the kitchen:
//   bin -> (chop on the board | grill) -> plate on the assembly counter -> window.
// A plate that matches a ticket exactly can be served at the window for coins plus
// a tip for the patience left; serve in a row and the combo multiplier grows.
import {
  BINS,
  BOARD_SLOTS,
  CHEF,
  COOK,
  FRESH_BONUS,
  FRESH_SECONDS,
  GRILL_SLOTS,
  LAYOUT,
  ORDERS,
  RUSH_SECONDS,
  SHIFT_SECONDS,
  SCORE,
  STEP,
} from './config.js';
import { drawOrder, INGREDIENTS, plateFitsRecipe, plateMatchesRecipe, readyState } from './recipes.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1 << 0;
export const EVENT_PLACE = 1 << 1;
export const EVENT_CHOP = 1 << 2;
export const EVENT_COOKED = 1 << 3;
export const EVENT_BURNT = 1 << 4;
export const EVENT_SERVED = 1 << 5;
export const EVENT_MISSED = 1 << 6;
export const EVENT_ERROR = 1 << 7;
export const EVENT_OVER = 1 << 8;
export const EVENT_RUSH = 1 << 9;
export const EVENT_TRASH = 1 << 10;

const STATION_NAMES = {
  bin: 'Ingredient bin',
  board: 'Chopping board',
  grill: 'Grill',
  plate: 'Assembly plate',
  window: 'Serving window',
  trash: 'Trash',
};

/** The rectangles the chef cannot walk through (counters and bins). */
function solidRects() {
  const rects = [LAYOUT.bins, LAYOUT.board, LAYOUT.grill, LAYOUT.plate, LAYOUT.window, LAYOUT.trash];
  return rects.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h }));
}

/** Push a circle out of a rectangle it overlaps. */
function pushOutCircleRect(px, py, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - nearestX;
  const dy = py - nearestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= radius * radius) return [px, py];
  if (distSq === 0) return [px, rect.y - radius];
  const dist = Math.sqrt(distSq);
  return [px + (dx / dist) * (radius - dist), py + (dy / dist) * (radius - dist)];
}

export function createWorld(random) {
  const state = {
    day: 1,
    elapsed: 0,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    over: false,
    rush: false,
    rushAnnounced: false,
    spawnIn: 6,
    nextOrderId: 1,
    orders: [],
    chef: { x: 640, y: 440, carrying: null, facing: 1, moving: false, target: null },
    grill: GRILL_SLOTS.map(() => ({ item: null })),
    board: BOARD_SLOTS.map(() => ({ item: null })),
    plate: [],
    /** Freshness (seconds left) of each item on the plate, same order as plate. */
    plateFresh: [],
    particles: [],
    popups: [],
    flashes: [],
    /** The station the chef can use right now (for the prompt + highlight). */
    near: null,
    /** Seconds the grill has sizzled (drives the sizzle loop). */
    sizzle: 0,
  };

  const solids = solidRects();

  function addPopup(x, y, text, colour) {
    state.popups.push({ x, y, text, colour, ttl: 1.4, age: 0 });
  }

  function burst(x, y, colour, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = random() * Math.PI * 2;
      const v = speed * (0.4 + random() * 0.8);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 40,
        colour,
        size: 3 + random() * 4,
        ttl: 0.5 + random() * 0.4,
        age: 0,
      });
    }
  }

  function spawnOrder() {
    if (state.orders.length >= ORDERS.maxActive) return;
    // Day progression: later days give every ticket less patience.
    const dayCut = Math.min(30, (state.day - 1) * ORDERS.patiencePerDay);
    const patience = Math.max(45, (state.rush ? ORDERS.patienceRush : ORDERS.patience) - dayCut);
    const order = {
      id: state.nextOrderId,
      recipe: drawOrder(random, state.elapsed, state.day).recipe,
      patience,
      remaining: patience,
    };
    state.nextOrderId += 1;
    state.orders.push(order);
  }

  /** The anchor point of a station (its centre), used for popups and bursts. */
  function stationAnchor(kind, id) {
    if (kind === 'bin') {
      const bin = BINS.find((b) => b.id === id);
      return { x: bin.x + bin.w / 2, y: bin.y + bin.h / 2 };
    }
    if (kind === 'board') {
      const s = BOARD_SLOTS[id];
      return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
    }
    if (kind === 'grill') {
      const s = GRILL_SLOTS[id];
      return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
    }
    if (kind === 'plate') return { x: LAYOUT.plate.x + LAYOUT.plate.w / 2, y: LAYOUT.plate.y + LAYOUT.plate.h / 2 };
    if (kind === 'window') return { x: LAYOUT.window.x + LAYOUT.window.w / 2, y: LAYOUT.window.y + 40 };
    return { x: LAYOUT.trash.x + LAYOUT.trash.w / 2, y: LAYOUT.trash.y + LAYOUT.trash.h / 2 };
  }

  /** The station descriptor nearestStation builds, for one named station. */
  function stationById(kind, id) {
    return { kind, id, ...stationAnchor(kind, id) };
  }

  /** Distance from a point to a rectangle (0 when the point is on its edge). */
  function distToRect(x, y, rect) {
    const dx = Math.max(rect.x - x, 0, x - (rect.x + rect.w));
    const dy = Math.max(rect.y - y, 0, y - (rect.y + rect.h));
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** The station whose edge the chef stands closest to, within reach. */
  function nearestStation() {
    const { x, y } = state.chef;
    let best = null;
    let bestDist = 90;
    const consider = (kind, id, rect) => {
      const d = distToRect(x, y, rect);
      if (d < bestDist) {
        bestDist = d;
        best = stationById(kind, id);
      }
    };
    for (const bin of BINS) consider('bin', bin.id, bin);
    state.board.forEach((slot, i) => consider('board', i, BOARD_SLOTS[i]));
    state.grill.forEach((slot, i) => consider('grill', i, GRILL_SLOTS[i]));
    consider('plate', 0, LAYOUT.plate);
    consider('window', 0, LAYOUT.window);
    consider('trash', 0, LAYOUT.trash);
    return best;
  }

  /**
   * Use one station. The human player uses whichever station is nearest
   * (state.near); the autopilot names its station exactly, so a chef standing
   * between two adjacent bins never uses the wrong one.
   */
  function interact(station) {
    const chef = state.chef;
    if (!station) return EVENT_NONE;
    if (station.kind === 'bin') {
      if (chef.carrying) return EVENT_ERROR;
      chef.carrying = { id: station.id, state: 'plain', hits: 0 };
      burst(station.x, station.y, INGREDIENTS[station.id].colour, 8, 90);
      return EVENT_PICKUP;
    }
    if (station.kind === 'board') {
      const slot = state.board[station.id];
      if (chef.carrying && !slot.item) {
        const prep = INGREDIENTS[chef.carrying.id].prep;
        if (prep !== 'chop') return EVENT_ERROR;
        slot.item = { ...chef.carrying, hits: 0 };
        chef.carrying = null;
        return EVENT_PLACE;
      }
      if (!chef.carrying && slot.item) {
        if (slot.item.hits < COOK.chopHits) {
          slot.item.hits += 1;
          burst(station.x, station.y - 10, '#cfe8b8', 10, 130);
          if (slot.item.hits >= COOK.chopHits) {
            slot.item.state = 'chopped';
            // Freshness starts the moment the chopping is done.
            slot.item.fresh = FRESH_SECONDS;
            return EVENT_CHOP | EVENT_COOKED;
          }
          return EVENT_CHOP;
        }
        chef.carrying = { id: slot.item.id, state: 'chopped', hits: 0, fresh: slot.item.fresh };
        slot.item = null;
        return EVENT_PICKUP;
      }
      return EVENT_ERROR;
    }
    if (station.kind === 'grill') {
      const slot = state.grill[station.id];
      if (chef.carrying && !slot.item) {
        const prep = INGREDIENTS[chef.carrying.id].prep;
        if (prep !== 'grill') return EVENT_ERROR;
        slot.item = { id: chef.carrying.id, progress: 0, done: false, burnt: false };
        chef.carrying = null;
        return EVENT_PLACE;
      }
      if (!chef.carrying && slot.item && (slot.item.done || slot.item.burnt)) {
        chef.carrying = {
          id: slot.item.id,
          state: slot.item.burnt ? 'burnt' : 'cooked',
          hits: 0,
          fresh: slot.item.fresh,
        };
        slot.item = null;
        return EVENT_PICKUP;
      }
      return EVENT_ERROR;
    }
    if (station.kind === 'plate') {
      if (chef.carrying) {
        const item = chef.carrying;
        if (item.state === 'burnt') return EVENT_ERROR;
        if (item.state !== readyState(item.id)) return EVENT_ERROR;
        if (state.plate.length >= 4) return EVENT_ERROR;
        const key = item.state === 'plain' ? item.id : `${item.id}:${item.state}`;
        const fits = state.orders.some((o) => plateFitsRecipe([...state.plate, key], o.recipe));
        if (!fits && state.plate.length > 0) return EVENT_ERROR;
        state.plate.push(key);
        // Freshness carries onto the plate: the clock keeps running there.
        state.plateFresh.push(typeof item.fresh === 'number' ? item.fresh : Infinity);
        chef.carrying = null;
        burst(station.x, station.y, '#f2c94c', 8, 80);
        return EVENT_PLACE;
      }
      return EVENT_ERROR;
    }
    if (station.kind === 'window') {
      const match = state.orders.find((o) => plateMatchesRecipe(state.plate, o.recipe));
      if (!match) return EVENT_ERROR;
      // Freshness decides the payout: an all-fresh dish earns a bonus, a dish
      // with any stale item in it earns no tip at all.
      const allFresh = state.plate.length > 0 && state.plateFresh.every((f) => f > 0);
      const anyStale = state.plateFresh.some((f) => f <= 0);
      const tip = anyStale ? 0 : Math.round(SCORE.maxTip * (match.remaining / match.patience));
      const freshBonus = allFresh ? FRESH_BONUS : 0;
      const mult = 1 + Math.min(SCORE.comboMax - 1, state.combo * SCORE.comboStep);
      const earned = Math.round((match.recipe.coins + tip + freshBonus) * mult);
      state.coins += earned;
      state.served += 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.orders = state.orders.filter((o) => o !== match);
      state.plate = [];
      state.plateFresh = [];
      // Popups rise over the open floor left of the window, clear of its header.
      addPopup(station.x - 280, station.y - 80, `+$${earned}`, '#f2c94c');
      if (allFresh) addPopup(station.x - 280, station.y - 112, `FRESH +$${FRESH_BONUS}`, '#8ee06a');
      if (anyStale) addPopup(station.x - 280, station.y - 112, 'STALE — no tip', '#e5534b');
      if (state.combo >= 2) addPopup(station.x - 280, station.y - 144, `COMBO x${mult.toFixed(2)}`, '#7bc96f');
      burst(station.x, station.y, '#f2c94c', 16, 160);
      return EVENT_SERVED;
    }
    if (station.kind === 'trash') {
      if (chef.carrying) {
        chef.carrying = null;
        return EVENT_TRASH;
      }
      if (state.plate.length > 0) {
        state.plate.pop();
        state.plateFresh.pop();
        return EVENT_TRASH;
      }
      return EVENT_ERROR;
    }
    return EVENT_NONE;
  }

  function step(dt, input) {
    if (state.over) return EVENT_NONE;
    let events = EVENT_NONE;
    state.elapsed += dt;

    // Rush hour: the last minute of the shift.
    if (!state.rush && state.elapsed >= SHIFT_SECONDS - RUSH_SECONDS) {
      state.rush = true;
      events |= EVENT_RUSH;
    }
    if (state.elapsed >= SHIFT_SECONDS) {
      state.over = true;
      return events | EVENT_OVER;
    }

    // New tickets.
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      spawnOrder();
      // Day progression: later days spawn tickets sooner.
      const base = state.rush ? ORDERS.spawnEveryRush : ORDERS.spawnEvery;
      const floor = state.rush ? 6 : 10;
      state.spawnIn = Math.max(floor, base - (state.day - 1) * ORDERS.spawnEveryPerDay);
    }

    // Ticket patience ticks down; an expired ticket is a miss.
    for (const order of [...state.orders]) {
      order.remaining -= dt;
      if (order.remaining <= 0) {
        state.orders = state.orders.filter((o) => o !== order);
        state.missed += 1;
        state.combo = 0;
        state.coins = Math.max(0, state.coins - ORDERS.missPenalty);
        addPopup(640, 150, `Order missed! -$${ORDERS.missPenalty}`, '#e5534b');
        events |= EVENT_MISSED;
      }
    }

    // The grill cooks; food left too long burns. Freshness ticks down on every
    // prepared item: board, grill, the chef's hands and the plate.
    let sizzling = false;
    for (const slot of state.grill) {
      const item = slot.item;
      if (!item) continue;
      sizzling = true;
      item.progress += dt;
      const cookTime = item.id === 'egg' ? COOK.egg : COOK.patty;
      if (!item.done && item.progress >= cookTime) {
        item.done = true;
        // Freshness starts the moment the grill finishes.
        item.fresh = FRESH_SECONDS;
        events |= EVENT_COOKED;
      }
      if (item.done && !item.burnt) {
        item.fresh = Math.max(0, (item.fresh ?? FRESH_SECONDS) - dt);
      }
      if (item.done && !item.burnt && item.progress >= cookTime + COOK.burnAfter) {
        item.burnt = true;
        events |= EVENT_BURNT;
        addPopup(730, 250, 'BURNT!', '#e5534b');
      }
    }
    state.sizzle = sizzling ? state.sizzle + dt : 0;

    // Steam rises off any slot that is cooking: a fresh particle every step
    // or two, so a live grill always has visible steam above it.
    state.steamIn = (state.steamIn ?? 0) + dt;
    if (sizzling && state.steamIn > 0.12) {
      state.steamIn = 0;
      const cooking = state.grill.map((s, i) => (s.item && !s.item.burnt ? i : -1)).filter((i) => i >= 0);
      if (cooking.length > 0) {
        const slot = GRILL_SLOTS[cooking[Math.floor(random() * cooking.length)]];
        state.particles.push({
          x: slot.x + 20 + random() * (slot.w - 40),
          y: slot.y + 14,
          vx: (random() - 0.5) * 12,
          vy: -46 - random() * 22,
          colour: '#ffffff',
          size: 7 + random() * 7,
          ttl: 1.1 + random() * 0.5,
          age: 0,
          steam: true,
        });
      }
    }

    // Freshness decay on the board (chopped only), in the chef's hands, on the plate.
    for (const slot of state.board) {
      if (slot.item && slot.item.state === 'chopped') {
        slot.item.fresh = Math.max(0, (slot.item.fresh ?? FRESH_SECONDS) - dt);
      }
    }
    if (state.chef.carrying && typeof state.chef.carrying.fresh === 'number') {
      state.chef.carrying.fresh = Math.max(0, state.chef.carrying.fresh - dt);
    }
    for (let i = 0; i < state.plateFresh.length; i += 1) {
      state.plateFresh[i] = Math.max(0, state.plateFresh[i] - dt);
    }

    // The chef moves: keys first, then a mouse click target. A caller may also
    // steer with an exact vector (input.mx/my, already normalised): boolean keys
    // only ever move at 45 degrees, which dives into corners instead of steering
    // around them, so the autopilot steers with a vector.
    const chef = state.chef;
    let mx = 0;
    let my = 0;
    if (typeof input.mx === 'number' || typeof input.my === 'number') {
      mx = input.mx || 0;
      my = input.my || 0;
    } else {
      if (input.left) mx -= 1;
      if (input.right) mx += 1;
      if (input.up) my -= 1;
      if (input.down) my += 1;
    }
    if (mx !== 0 || my !== 0) {
      chef.target = null;
      const len = Math.sqrt(mx * mx + my * my);
      chef.x += (mx / len) * CHEF.speed * dt;
      chef.y += (my / len) * CHEF.speed * dt;
      chef.facing = mx !== 0 ? Math.sign(mx) : chef.facing;
      chef.moving = true;
    } else if (chef.target) {
      const dx = chef.target.x - chef.x;
      const dy = chef.target.y - chef.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 8) {
        chef.target = null;
        chef.moving = false;
      } else {
        chef.x += (dx / dist) * CHEF.speed * dt;
        chef.y += (dy / dist) * CHEF.speed * dt;
        chef.facing = dx !== 0 ? Math.sign(dx) : chef.facing;
        chef.moving = true;
      }
    } else {
      chef.moving = false;
    }
    if (input.click) chef.target = { x: input.click.x, y: input.click.y };

    // Stay on the floor and out of the counters.
    const floor = LAYOUT.floor;
    chef.x = Math.max(floor.x + CHEF.radius, Math.min(floor.x + floor.w - CHEF.radius, chef.x));
    chef.y = Math.max(floor.y + CHEF.radius, Math.min(floor.y + floor.h - CHEF.radius, chef.y));
    for (const rect of solids) {
      [chef.x, chef.y] = pushOutCircleRect(chef.x, chef.y, CHEF.radius, rect);
    }

    state.near = nearestStation();
    if (input.interact) events |= interact(state.near);

    // Particles and popups age out. Steam rises instead of falling.
    for (const p of state.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.steam) {
        p.vx += Math.sin((p.age * 6 + p.x * 0.05)) * 8 * dt;
      } else {
        p.vy += 260 * dt;
      }
    }
    state.particles = state.particles.filter((p) => p.age < p.ttl);
    for (const p of state.popups) p.age += dt;
    state.popups = state.popups.filter((p) => p.age < p.ttl);

    return events;
  }

  /** Reset for a new day: faster tickets, less patience, same kitchen. */
  function nextDay() {
    state.day += 1;
    state.elapsed = 0;
    state.over = false;
    state.rush = false;
    state.spawnIn = 5;
    state.orders = [];
    state.grill = GRILL_SLOTS.map(() => ({ item: null }));
    state.board = BOARD_SLOTS.map(() => ({ item: null }));
    state.plate = [];
    state.plateFresh = [];
    state.particles = [];
    state.popups = [];
    state.chef.carrying = null;
    state.chef.x = 640;
    state.chef.y = 440;
  }

  return {
    state,
    step,
    nextDay,
    stationName: (station) => (station ? STATION_NAMES[station.kind] : null),
    /** Use one named station directly (the autopilot's explicit station). */
    useStation: (kind, id) => interact(stationById(kind, id)),
  };
}
