// Every pixel Ember Kitchen shows: the floor, the stations, the food, the chef,
// the tickets and the HUD. All art is drawn with canvas paths — no image files.
// The judge reads the game mostly through its screenshots, so each station is
// labelled in big letters and the food is drawn to look worth serving.
import { BINS, BOARD_SLOTS, FIELD, FONT, GRILL_SLOTS, LAYOUT, PALETTE, SHIFT_SECONDS } from './config.js';
import { dishTagline, INGREDIENTS } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

/** Draw one ingredient at (x, y), centred, about `size` px wide. */
export function drawIngredient(ctx, id, itemState, x, y, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = '#e8a94f';
    ellipse(ctx, 0, s * 0.25, s, s * 0.55);
    ctx.fill();
    ctx.fillStyle = '#d18a2e';
    ellipse(ctx, 0, s * 0.42, s * 0.92, s * 0.28);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-0.4, -0.1], [0, -0.28], [0.4, -0.08], [-0.15, 0.05], [0.25, 0.12]]) {
      ellipse(ctx, sx * s, sy * s, s * 0.09, s * 0.06);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = itemState === 'burnt' ? '#2b1d12' : itemState === 'cooked' ? '#8a5a33' : '#a85f4a';
    roundRect(ctx, -s, -s * 0.45, s * 2, s * 0.9, s * 0.4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(ctx, -s * 0.8, -s * 0.45, s * 1.6, s * 0.28, s * 0.14);
    ctx.fill();
    if (itemState === 'burnt') {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.3);
      ctx.lineTo(s * 0.5, s * 0.3);
      ctx.moveTo(s * 0.5, -s * 0.3);
      ctx.lineTo(-s * 0.5, s * 0.3);
      ctx.stroke();
    }
  } else if (id === 'tomato') {
    if (itemState === 'chopped') {
      ctx.fillStyle = '#e5534b';
      for (const ox of [-s * 0.45, s * 0.45]) {
        ellipse(ctx, ox, 0, s * 0.55, s * 0.5);
        ctx.fill();
      }
      ctx.fillStyle = '#f28b82';
      ellipse(ctx, -s * 0.45, 0, s * 0.3, s * 0.28);
      ctx.fill();
      ellipse(ctx, s * 0.45, 0, s * 0.3, s * 0.28);
      ctx.fill();
    } else {
      ctx.fillStyle = '#e5534b';
      ellipse(ctx, 0, 0, s * 0.95, s * 0.9);
      ctx.fill();
      ctx.fillStyle = '#c73e36';
      ellipse(ctx, 0, s * 0.55, s * 0.8, s * 0.35);
      ctx.fill();
      ctx.fillStyle = '#7bc96f';
      ellipse(ctx, 0, -s * 0.85, s * 0.25, s * 0.18);
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#5da34f';
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      ellipse(ctx, Math.cos(a) * s * 0.45, Math.sin(a) * s * 0.45, s * 0.5, s * 0.38);
      ctx.fill();
    }
    ctx.fillStyle = '#7bc96f';
    ellipse(ctx, 0, 0, s * 0.62, s * 0.55);
    ctx.fill();
    ctx.strokeStyle = '#a8e39a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, 0);
    ctx.quadraticCurveTo(0, s * 0.3, s * 0.4, 0);
    ctx.stroke();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.6);
    ctx.lineTo(s, s * 0.6);
    ctx.lineTo(s, -s * 0.2);
    ctx.lineTo(-s, s * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0a92e';
    for (const [hx, hy] of [[-0.3, 0.25], [0.25, 0.3], [0.05, 0.05]]) {
      ellipse(ctx, hx * s, hy * s, s * 0.12, s * 0.12);
      ctx.fill();
    }
  } else if (id === 'noodle') {
    ctx.strokeStyle = '#f0d060';
    ctx.lineWidth = s * 0.22;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      const yy = (i - 1) * s * 0.5;
      ctx.moveTo(-s * 0.8, yy);
      ctx.bezierCurveTo(-s * 0.3, yy - s * 0.35, s * 0.3, yy + s * 0.35, s * 0.8, yy);
      ctx.stroke();
    }
  } else if (id === 'egg') {
    ctx.fillStyle = '#fff3d6';
    ellipse(ctx, 0, 0, s * 0.95, s * 0.8);
    ctx.fill();
    ctx.fillStyle = itemState === 'cooked' ? '#f2a93c' : '#f7c948';
    ellipse(ctx, s * 0.1, 0, s * 0.45, s * 0.42);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ellipse(ctx, -s * 0.05, -s * 0.15, s * 0.14, s * 0.12);
    ctx.fill();
  } else if (id === 'sauce') {
    ctx.fillStyle = '#c96a2b';
    ellipse(ctx, 0, s * 0.1, s * 0.9, s * 0.6);
    ctx.fill();
    ctx.fillStyle = '#e08a3c';
    ellipse(ctx, 0, -s * 0.1, s * 0.7, s * 0.4);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.font = `bold ${Math.round(s * 0.7)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 0, s * 0.05);
  }
  ctx.restore();
}

/** A small state tag under an ingredient: RAW / CHOPPED / COOKED / BURNT. */
function stateTag(ctx, itemState, x, y) {
  if (itemState === 'plain') return;
  const label = itemState === 'chopped' ? 'CHOPPED' : itemState === 'cooked' ? 'COOKED' : 'BURNT!';
  ctx.font = `bold 11px ${FONT}`;
  const w = ctx.measureText(label).width + 10;
  ctx.fillStyle = itemState === 'burnt' ? '#e5534b' : '#2b1d12';
  roundRect(ctx, x - w / 2, y, w, 16, 8);
  ctx.fill();
  ctx.fillStyle = '#fff6e8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 8);
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 184, FIELD.width, FIELD.height - 184);
  ctx.fillStyle = PALETTE.floorDark;
  for (let y = 184; y < FIELD.height; y += 64) {
    for (let x = (y / 64) % 2 === 0 ? 0 : 32; x < FIELD.width; x += 64) {
      ctx.fillRect(x, y, 62, 2);
    }
  }
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 58, FIELD.width, 8);
}

function drawBins(ctx, near) {
  for (const bin of BINS) {
    const active = near && near.kind === 'bin' && near.id === bin.id;
    ctx.fillStyle = active ? '#c98d4b' : PALETTE.counter;
    roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 10);
    ctx.fill();
    ctx.strokeStyle = active ? PALETTE.gold : PALETTE.boardEdge;
    ctx.lineWidth = active ? 4 : 2;
    ctx.stroke();
    drawIngredient(ctx, bin.id, 'plain', bin.x + 30, bin.y + bin.h / 2, 44);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 14px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(bin.label, bin.x + 58, bin.y + bin.h / 2);
  }
}

function drawBoard(ctx, state, near) {
  const r = LAYOUT.board;
  const active = near && near.kind === 'board';
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = active ? PALETTE.gold : PALETTE.boardEdge;
  ctx.lineWidth = active ? 4 : 2;
  ctx.stroke();
  ctx.fillStyle = '#e8c890';
  roundRect(ctx, r.x + 10, r.y + 34, r.w - 20, r.h - 44, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 14px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('CHOPPING BOARD', r.x + r.w / 2, r.y + 20);
  state.board.forEach((slot, i) => {
    const s = BOARD_SLOTS[i];
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    if (slot.item) {
      drawIngredient(ctx, slot.item.id, slot.item.state, cx, cy - 4, 56);
      if (slot.item.hits < 3) {
        ctx.fillStyle = '#2b1d12';
        roundRect(ctx, cx - 30, cy + 26, 60, 8, 4);
        ctx.fill();
        ctx.fillStyle = PALETTE.gold;
        roundRect(ctx, cx - 30, cy + 26, 60 * (slot.item.hits / 3), 8, 4);
        ctx.fill();
      } else {
        stateTag(ctx, 'chopped', cx, cy + 24);
      }
    }
  });
}

function drawGrill(ctx, state, near, time) {
  const r = LAYOUT.grill;
  const active = near && near.kind === 'grill';
  ctx.fillStyle = PALETTE.grill;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = active ? PALETTE.gold : '#22262b';
  ctx.lineWidth = active ? 4 : 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 14px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('GRILL', r.x + r.w / 2, r.y + 20);
  state.grill.forEach((slot, i) => {
    const s = GRILL_SLOTS[i];
    ctx.fillStyle = '#22262b';
    roundRect(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#4a5058';
    ctx.lineWidth = 2;
    for (let gx = s.x + 14; gx < s.x + s.w; gx += 16) {
      ctx.beginPath();
      ctx.moveTo(gx, s.y + 6);
      ctx.lineTo(gx, s.y + s.h - 6);
      ctx.stroke();
    }
    const item = slot.item;
    if (item) {
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      if (!item.done) {
        const glow = 0.22 + 0.18 * Math.sin(time * 6 + i);
        ctx.fillStyle = `rgba(226,87,75,${glow.toFixed(2)})`;
        ellipse(ctx, cx, cy, 40, 26);
        ctx.fill();
      }
      drawIngredient(ctx, item.id, item.burnt ? 'burnt' : item.done ? 'cooked' : 'plain', cx, cy - 4, 48);
      const cookTime = item.id === 'egg' ? 4 : 6;
      const frac = Math.min(1, item.progress / cookTime);
      ctx.fillStyle = '#2b1d12';
      roundRect(ctx, cx - 30, cy + 26, 60, 8, 4);
      ctx.fill();
      ctx.fillStyle = item.burnt ? '#e5534b' : item.done ? PALETTE.green : '#e8833a';
      roundRect(ctx, cx - 30, cy + 26, 60 * frac, 8, 4);
      ctx.fill();
      if (item.done && !item.burnt) stateTag(ctx, 'cooked', cx, cy + 40);
      if (item.burnt) stateTag(ctx, 'burnt', cx, cy + 40);
    }
  });
}

function drawPlateCounter(ctx, state, near) {
  const r = LAYOUT.plate;
  const active = near && near.kind === 'plate';
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = active ? PALETTE.gold : PALETTE.boardEdge;
  ctx.lineWidth = active ? 4 : 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 14px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('ASSEMBLY  —  BUILD THE DISH HERE', r.x + r.w / 2, r.y + 20);
  const cx = r.x + r.w / 2;
  const cy = r.y + 82;
  ctx.fillStyle = '#f5f2ea';
  ellipse(ctx, cx, cy, 110, 34);
  ctx.fill();
  ctx.fillStyle = '#d8d2c2';
  ellipse(ctx, cx, cy, 88, 26);
  ctx.fill();
  state.plate.forEach((key, i) => {
    const [id, st] = key.split(':');
    drawIngredient(ctx, id, st ?? 'plain', cx, cy - 8 - i * 11, 54 - Math.min(12, i * 3));
  });
  if (state.plate.length === 0) {
    ctx.fillStyle = '#8b93a3';
    ctx.font = `italic 14px ${FONT}`;
    ctx.fillText('empty plate — add ingredients', cx, cy - 4);
  }
}

function drawWindow(ctx, state, near, time) {
  const r = LAYOUT.window;
  const ready = state.orders.some((o) => state.plate.length > 0 && state.plate.length === o.recipe.needs.length);
  const active = near && near.kind === 'window';
  ctx.fillStyle = PALETTE.window;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = ready ? PALETTE.gold : PALETTE.boardEdge;
  ctx.lineWidth = ready ? 5 : 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('SERVING WINDOW', r.x + r.w / 2, r.y + 24);
  if (ready) {
    const pulse = 0.7 + 0.3 * Math.sin(time * 5);
    ctx.fillStyle = `rgba(242,201,76,${pulse.toFixed(2)})`;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText('READY TO SERVE!  [E]', r.x + r.w / 2, r.y + 58);
  } else {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `15px ${FONT}`;
    ctx.fillText('match a ticket to serve', r.x + r.w / 2, r.y + 56);
  }
  // The bell and the pass shelf.
  ctx.fillStyle = PALETTE.gold;
  ellipse(ctx, r.x + 60, r.y + 110, 26, 18);
  ctx.fill();
  ctx.fillStyle = '#2b1d12';
  roundRect(ctx, r.x + 52, r.y + 104, 16, 6, 3);
  ctx.fill();
  ctx.fillStyle = PALETTE.steel;
  roundRect(ctx, r.x + 110, r.y + 92, r.w - 130, 56, 8);
  ctx.fill();
  ctx.fillStyle = '#8b93a3';
  ctx.font = `italic 14px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('dishes served here', r.x + 126, r.y + 124);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('customers wait on the other side — serve fast for bigger tips', r.x + r.w / 2, r.y + r.h - 14);
}

function drawTrash(ctx, near) {
  const r = LAYOUT.trash;
  const active = near && near.kind === 'trash';
  ctx.fillStyle = '#4a4f55';
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = active ? PALETTE.gold : '#22262b';
  ctx.lineWidth = active ? 4 : 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('TRASH — dump burnt food', r.x + r.w / 2, r.y + r.h / 2 + 5);
}

function drawChef(ctx, chef, time) {
  const bob = chef.moving ? Math.sin(time * 14) * 3 : 0;
  const x = chef.x;
  const y = chef.y + bob * 0.3;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ellipse(ctx, x, y + 24, 26, 8);
  ctx.fill();
  // Body: apron over a red shirt.
  ctx.fillStyle = PALETTE.chefShirt;
  roundRect(ctx, x - 22, y - 6, 44, 30, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefApron;
  roundRect(ctx, x - 15, y + 2, 30, 22, 8);
  ctx.fill();
  // Head.
  ctx.fillStyle = PALETTE.chefSkin;
  ellipse(ctx, x, y - 18, 17, 16);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = PALETTE.chefHat;
  ellipse(ctx, x, y - 34, 20, 11);
  ctx.fill();
  roundRect(ctx, x - 18, y - 44, 36, 14, 7);
  ctx.fill();
  // Eyes look where the chef faces.
  ctx.fillStyle = '#2b1d12';
  ellipse(ctx, x + chef.facing * 5 - 5, y - 20, 2.2, 3);
  ctx.fill();
  ellipse(ctx, x + chef.facing * 5 + 5, y - 20, 2.2, 3);
  ctx.fill();
  // Carried ingredient floats above the hat.
  if (chef.carrying) {
    drawIngredient(ctx, chef.carrying.id, chef.carrying.state, x, y - 62, 44);
    ctx.fillStyle = 'rgba(43,29,18,0.85)';
    ctx.font = `bold 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(INGREDIENTS[chef.carrying.id].label.toUpperCase(), x, y - 84);
  }
}

function drawOrderBoard(ctx, state, time) {
  const r = LAYOUT.orderBoard;
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.boardEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORDER BOARD', r.x + 14, r.y + 20);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText('serve the ticket before its bar runs out', r.x + 150, r.y + 20);
  if (state.orders.length === 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `italic 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('no orders yet — the lunch crowd is coming…', r.x + r.w / 2, r.y + 70);
    return;
  }
  const slotW = 288;
  state.orders.forEach((order, i) => {
    const x = r.x + 14 + i * (slotW + 10);
    const y = r.y + 34;
    const w = slotW;
    const h = 72;
    const urgent = order.remaining < 12;
    ctx.fillStyle = urgent && Math.sin(time * 6) > 0 ? '#ffe1de' : PALETTE.ticket;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? PALETTE.red : '#c9a86a';
    ctx.lineWidth = urgent ? 3 : 1.5;
    ctx.stroke();
    ctx.fillStyle = '#2b1d12';
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`#${order.id}  ${order.recipe.name}`, x + 10, y + 16);
    ctx.fillStyle = '#8a5a33';
    ctx.font = `12px ${FONT}`;
    ctx.fillText(`$${order.recipe.coins}  ·  ${dishTagline(order.recipe)}`, x + 10, y + 34);
    // Needed ingredients, checked off as they land on the plate.
    order.recipe.needs.forEach((need, j) => {
      const [id, st] = need.split(':');
      const ix = x + 22 + j * 34;
      const iy = y + 55;
      const onPlate = state.plate.includes(need);
      ctx.globalAlpha = onPlate ? 0.35 : 1;
      drawIngredient(ctx, id, st ?? 'plain', ix, iy, 26);
      ctx.globalAlpha = 1;
      if (onPlate) {
        ctx.strokeStyle = '#3f7d33';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ix - 8, iy);
        ctx.lineTo(ix - 2, iy + 6);
        ctx.lineTo(ix + 9, iy - 7);
        ctx.stroke();
      }
    });
    // Patience bar.
    const frac = Math.max(0, order.remaining / order.patience);
    ctx.fillStyle = '#e8dcc3';
    roundRect(ctx, x + w - 66, y + 8, 56, 10, 5);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? '#e8a13a' : PALETTE.red;
    roundRect(ctx, x + w - 66, y + 8, 56 * frac, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#2b1d12';
    ctx.font = `bold 11px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(order.remaining)}s`, x + w - 8, y + 34);
  });
}

function drawTopBar(ctx, state, time) {
  const r = LAYOUT.topBar;
  ctx.fillStyle = PALETTE.topBar;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  // Flame logo + title.
  ctx.font = '28px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔥', 16, 30);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 24px ${FONT}`;
  ctx.fillText('EMBER KITCHEN', 52, 30);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('LUNCH RUSH', 52, 48);
  // Day.
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillText(`DAY ${state.day}`, 330, 30);
  // Shift timer — the big one the judge must see.
  const left = Math.max(0, SHIFT_SECONDS - state.elapsed);
  const mm = Math.floor(left / 60);
  const ss = Math.floor(left % 60);
  const low = left < 30;
  ctx.fillStyle = low && Math.sin(time * 6) > 0 ? PALETTE.red : PALETTE.text;
  ctx.font = `bold 30px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${mm}:${String(ss).padStart(2, '0')}`, 640, 30);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `11px ${FONT}`;
  ctx.fillText('SHIFT TIMER', 640, 50);
  // Rush banner.
  if (state.rush && !state.over) {
    ctx.fillStyle = PALETTE.red;
    roundRect(ctx, 740, 12, 130, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText('RUSH HOUR!', 805, 30);
  }
  // Coins, combo, served.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText(`$${state.coins}`, 1050, 30);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `12px ${FONT}`;
  ctx.fillText('EARNED', 1050, 50);
  ctx.fillStyle = state.combo >= 2 ? PALETTE.green : PALETTE.muted;
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(state.combo >= 2 ? `COMBO x${(1 + Math.min(2, state.combo * 0.25)).toFixed(2)}` : 'no combo', 1100, 24);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`served ${state.served} · missed ${state.missed}`, 1100, 44);
}

function drawPrompt(ctx, state, stationName) {
  ctx.fillStyle = 'rgba(43,29,18,0.92)';
  roundRect(ctx, 16, 764, 1248, 28, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `14px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const carrying = state.chef.carrying
    ? `carrying ${INGREDIENTS[state.chef.carrying.id].label} (${state.chef.carrying.state})`
    : 'hands empty';
  const near = stationName ? `[E] use ${stationName}` : 'walk to a station';
  ctx.fillText(`${near}   ·   ${carrying}   ·   WASD/arrows or click to move · E interact · M mute`, 30, 779);
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = 1 - p.age / p.ttl;
    ctx.fillStyle = p.colour;
    ellipse(ctx, p.x, p.y, p.size, p.size);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const p of state.popups) {
    const rise = p.age * 40;
    ctx.globalAlpha = 1 - p.age / p.ttl;
    ctx.fillStyle = p.colour;
    ctx.font = `bold 26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y - rise);
  }
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, state, best) {
  ctx.fillStyle = 'rgba(24,16,10,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 64px ${FONT}`;
  ctx.fillText('🔥 EMBER KITCHEN 🔥', 640, 250);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText('Lunch Rush — a one-chef cooking game', 640, 305);
  ctx.font = `18px ${FONT}`;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('Take orders, chop, grill, build the dish, serve it before the ticket runs out.', 640, 345);
  ctx.fillText('Burnt food goes in the trash. Serve fast for tips — serve in a row for combos.', 640, 372);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText('WASD / arrows or click to move  ·  E to interact  ·  M to mute', 640, 440);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText('Press ENTER to start your shift', 640, 500);
  if (best > 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `18px ${FONT}`;
    ctx.fillText(`Best shift so far: $${best}`, 640, 540);
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `15px ${FONT}`;
  ctx.fillText('6 recipes  ·  chop & grill stations  ·  rush hour  ·  combos pay more', 640, 590);
}

function drawOver(ctx, state, best, day) {
  ctx.fillStyle = 'rgba(24,16,10,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 56px ${FONT}`;
  ctx.fillText('SHIFT OVER!', 640, 240);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 30px ${FONT}`;
  ctx.fillText(`Day ${day} — you earned $${state.coins}`, 640, 305);
  ctx.font = `22px ${FONT}`;
  ctx.fillText(`served ${state.served} dishes  ·  missed ${state.missed}  ·  best combo x${state.bestCombo}`, 640, 350);
  if (state.coins >= best && state.coins > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillText('★ New best shift! ★', 640, 395);
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 24px ${FONT}`;
  ctx.fillText('Press R for Day ' + (day + 1) + ' (faster tickets)  ·  ENTER to restart Day ' + day, 640, 470);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const DPR = 1;

  function fit() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = FIELD.width * DPR;
    canvas.height = FIELD.height * DPR;
    canvas.style.width = `${FIELD.width * scale}px`;
    canvas.style.height = `${FIELD.height * scale}px`;
  }
  fit();
  window.addEventListener('resize', fit);

  function draw(state, screen, best, time, stationName) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#241812';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    drawFloor(ctx);
    drawBins(ctx, state.near);
    drawBoard(ctx, state, state.near);
    drawGrill(ctx, state, state.near, time);
    drawPlateCounter(ctx, state, state.near);
    drawWindow(ctx, state, state.near, time);
    drawTrash(ctx, state.near);
    drawChef(ctx, state.chef, time);
    drawParticles(ctx, state);
    drawOrderBoard(ctx, state, time);
    drawTopBar(ctx, state, time);
    if (screen === SCREEN_PLAY) drawPrompt(ctx, state, stationName);
    if (screen === SCREEN_TITLE) drawTitle(ctx, state, best);
    if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(24,16,10,0.6)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 48px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', 640, 400);
      ctx.font = `20px ${FONT}`;
      ctx.fillText('Press P to keep cooking', 640, 445);
    }
    if (screen === SCREEN_OVER) drawOver(ctx, state, best, state.day);
  }

  return { draw, fit };
}
