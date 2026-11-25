// The screenshot scenes behind ?shot=cover|rush|chop|serve. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a small
// task planner (walk to the next station the current dish needs, use it, repeat),
// so the frame is what real play looks like and the same seed always gives the
// same frame. After the autopilot, the scene is nudged into its photogenic state
// (a plate mid-assembly, a patty on the grill, tickets with time left) using only
// states real play can reach.
//
// Every station use names its station exactly (world.useStation): the chef often
// stands between two adjacent bins, and "nearest" would pick the wrong one.
import { BINS, BOARD_SLOTS, CHEF, GRILL_SLOTS, LAYOUT, STEP } from './config.js';
import { INGREDIENTS, readyState } from './recipes.js';
import { SCREEN_PLAY } from './render.js';

const SAMPLE = STEP;

/** Distance between two points. */
function dist(ax, ay, bx, by) {
  return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
}

/** Walk the chef toward a point for one step; true once he is close. Steers with
 * an exact vector, not 8-direction keys, so the path is the straight line to
 * the point and does not dive into the trash corner. */
function walkToward(world, tx, ty) {
  const chef = world.state.chef;
  const dx = tx - chef.x;
  const dy = ty - chef.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 15) return true;
  const input = { mx: dx / d, my: dy / d, interact: false, click: null };
  world.step(SAMPLE, input);
  return false;
}

/**
 * One autopilot errand: walk to the reachable side of a station rect. Walk only —
 * it never uses the station itself, so the caller's single useAt is the one
 * use (using twice would put a picked-up patty straight back on the grill).
 * Returns true when the chef arrived within `budget` steps.
 */
function errand(world, rect, budget, side = 'below') {
  let target;
  if (side === 'right') {
    target = { x: rect.x + rect.w + CHEF.radius + 14, y: rect.y + rect.h / 2 };
  } else if (side === 'above') {
    target = { x: rect.x + rect.w / 2, y: rect.y - CHEF.radius - 14 };
  } else {
    target = { x: rect.x + rect.w / 2, y: rect.y + rect.h + CHEF.radius + 14 };
  }
  for (let i = 0; i < budget; i += 1) {
    if (world.state.over) return false;
    const arrived = walkToward(world, target.x, Math.min(target.y, LAYOUT.floor.y + LAYOUT.floor.h - 40));
    if (arrived) return true;
  }
  return false;
}

/**
 * Use one named station, but only when the chef stands close to its rect: the
 * proximity check is the guard, the name is the aim.
 */
function useAt(world, kind, id, rect) {
  const chef = world.state.chef;
  const cx = Math.max(rect.x, Math.min(chef.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(chef.y, rect.y + rect.h));
  if (dist(chef.x, chef.y, cx, cy) >= 120) return 0;
  return world.useStation(kind, id);
}

function binRect(id) {
  return BINS.find((b) => b.id === id);
}

/** Chop whatever sits on the board until it is chopped, then pick it up and stop:
 * one more use after the pickup would put it straight back on the board. */
function chopAndTake(world) {
  for (let round = 0; round < 4; round += 1) {
    const slotIndex = world.state.board.findIndex((s) => s.item);
    if (slotIndex < 0) return;
    if (world.state.chef.carrying) return;
    errand(world, BOARD_SLOTS[slotIndex], 600);
    for (let hit = 0; hit < 6; hit += 1) {
      useAt(world, 'board', slotIndex, BOARD_SLOTS[slotIndex]);
      if (world.state.chef.carrying) return;
      world.step(SAMPLE, { left: false, right: false, up: false, down: false, interact: false, click: null });
    }
  }
}

/** Grill the carried patty/egg until it is cooked, then pick it up. */
function grillAndTake(world) {
  const slotIndex = world.state.grill.findIndex((s) => s.item);
  if (slotIndex < 0) return;
  // Wait at the grill while it cooks (the world ticks on).
  for (let i = 0; i < 60 * 8; i += 1) {
    world.step(SAMPLE, { left: false, right: false, up: false, down: false, interact: false, click: null });
    if (world.state.grill[slotIndex].item && world.state.grill[slotIndex].item.done) break;
  }
  errand(world, GRILL_SLOTS[slotIndex], 600);
  useAt(world, 'grill', slotIndex, GRILL_SLOTS[slotIndex]);
}

/** Cook one whole dish from the first ticket, ingredient by ingredient. */
function cookFirstTicket(world) {
  const order = world.state.orders[0];
  if (!order) return;
  for (const need of order.recipe.needs) {
    if (world.state.over) return;
    const [id] = need.split(':');
    const prep = INGREDIENTS[id].prep;
    errand(world, binRect(id), 900, 'right');
    useAt(world, 'bin', id, binRect(id));
    if (!world.state.chef.carrying) continue;
    if (prep === 'chop') {
      const free = world.state.board.findIndex((s) => !s.item);
      if (free < 0) continue;
      errand(world, BOARD_SLOTS[free], 600);
      useAt(world, 'board', free, BOARD_SLOTS[free]);
      chopAndTake(world);
    } else if (prep === 'grill') {
      const free = world.state.grill.findIndex((s) => !s.item);
      if (free < 0) continue;
      errand(world, GRILL_SLOTS[free], 600);
      useAt(world, 'grill', free, GRILL_SLOTS[free]);
      grillAndTake(world);
    }
    if (!world.state.chef.carrying) continue;
    if (world.state.chef.carrying.state !== readyState(id) && world.state.chef.carrying.state !== 'plain') continue;
    errand(world, LAYOUT.plate, 900);
    useAt(world, 'plate', 0, LAYOUT.plate);
  }
}

/** Let the world idle so tickets spawn and the grill steams. */
function idle(world, seconds) {
  const steps = Math.floor(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    if (world.state.over) return;
    world.step(SAMPLE, { left: false, right: false, up: false, down: false, interact: false, click: null });
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Scenes: cover (busy mid-shift), rush (four tickets, one nearly out),
 * chop (chopping at the board), serve (a finished plate at the window).
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'chop') {
    idle(world, 8);
    const order = state.orders[0];
    if (order) {
      const chopNeed = order.recipe.needs.find((n) => INGREDIENTS[n.split(':')[0]].prep === 'chop');
      const id = chopNeed ? chopNeed.split(':')[0] : 'tomato';
      errand(world, binRect(id), 900, 'right');
      useAt(world, 'bin', id, binRect(id));
      const free = state.board.findIndex((s) => !s.item);
      if (free >= 0 && state.chef.carrying) {
        errand(world, BOARD_SLOTS[free], 600);
        useAt(world, 'board', free, BOARD_SLOTS[free]);
        // Two chops in: the tomato is mid-chop, bits flying.
        useAt(world, 'board', free, BOARD_SLOTS[free]);
        useAt(world, 'board', free, BOARD_SLOTS[free]);
      }
    }
    return { screen: SCREEN_PLAY };
  }

  if (name === 'serve') {
    idle(world, 10);
    cookFirstTicket(world);
    // Serve the finished dish, then build the next one and serve that too:
    // the last serve is the final action, so its "+$…" popup and the burst of
    // sparkles are still fresh in the frame.
    const serveDish = () => {
      const match = state.orders.find((o) => state.plate.length === o.recipe.needs.length);
      if (match) {
        errand(world, LAYOUT.window, 900, 'above');
        useAt(world, 'window', 0, LAYOUT.window);
      }
    };
    serveDish();
    idle(world, 4);
    cookFirstTicket(world);
    // Start the next dish's patty so the grill is alive in the frame, then
    // serve as the very last action: the "+$…" popup must still be fresh.
    const freeGrill = state.grill.findIndex((s) => !s.item);
    if (freeGrill >= 0) {
      errand(world, binRect('patty'), 900, 'right');
      useAt(world, 'bin', 'patty', binRect('patty'));
      if (state.chef.carrying) {
        errand(world, GRILL_SLOTS[freeGrill], 600);
        useAt(world, 'grill', freeGrill, GRILL_SLOTS[freeGrill]);
        idle(world, 2);
      }
    }
    serveDish();
    return { screen: SCREEN_PLAY };
  }

  if (name === 'rush') {
    idle(world, 100);
    cookFirstTicket(world);
    idle(world, 20);
    // Force the rush look: four tickets, one about to expire.
    while (state.orders.length < 4) idle(world, 10);
    if (state.orders.length > 0) state.orders[0].remaining = 9;
    state.coins = 86;
    state.combo = 3;
    state.served = 7;
    state.missed = 0;
    return { screen: SCREEN_PLAY };
  }

  // cover: the default — a busy mid-shift frame with everything in it.
  idle(world, 12);
  cookFirstTicket(world);
  // Guarantee the cover shows a dish mid-assembly: a plate with 3 of 4 items
  // and the chef carrying the last one, plus a patty sizzling on the grill.
  const order = state.orders.find((o) => state.plate.length > 0 && state.plate.length < o.recipe.needs.length);
  if (order) {
    const missing = order.recipe.needs.find((n) => !state.plate.includes(n));
    if (missing) {
      const [id] = missing.split(':');
      const prep = INGREDIENTS[id].prep;
      if (prep === 'raw' && !state.chef.carrying) {
        errand(world, binRect(id), 900, 'right');
        useAt(world, 'bin', id, binRect(id));
      }
    }
  }
  const freeGrill = state.grill.findIndex((s) => !s.item);
  if (freeGrill >= 0 && !state.chef.carrying) {
    errand(world, binRect('patty'), 900, 'right');
    useAt(world, 'bin', 'patty', binRect('patty'));
    if (state.chef.carrying) {
      errand(world, GRILL_SLOTS[freeGrill], 600);
      useAt(world, 'grill', freeGrill, GRILL_SLOTS[freeGrill]);
      idle(world, 3);
    }
  }
  state.coins = 47;
  state.combo = 2;
  state.served = 4;
  return { screen: SCREEN_PLAY };
}
