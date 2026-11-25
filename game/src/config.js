// Every tuning number, colour and layout rect in one place. The kitchen is a fixed
// 1280x800 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size. All art is drawn with canvas paths — no image files.
export const FIELD = { width: 1280, height: 800 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One work shift, in seconds. The last 60 seconds are RUSH HOUR. */
export const SHIFT_SECONDS = 180;
export const RUSH_SECONDS = 60;

export const CHEF = {
  radius: 26,
  speed: 360,
  carryOffsetY: -34,
};

export const ORDERS = {
  maxActive: 4,
  /** Patience of a fresh ticket, in seconds; rush hour shortens it. */
  patience: 75,
  patienceRush: 55,
  /** Seconds between new tickets; rush hour spawns faster. */
  spawnEvery: 15,
  spawnEveryRush: 9,
  /** Coins lost when a ticket expires unserved. */
  missPenalty: 5,
  /** Day progression: each new day cuts patience by this many seconds
   * (floor 45) and spawns tickets this many seconds sooner (floor 10 s,
   * 6 s in rush). Day 1 is the gentle shift; Day 3 already bites. */
  patiencePerDay: 5,
  spawnEveryPerDay: 1,
};

/** Grill / fry timing, in seconds. */
export const COOK = {
  patty: 6,
  egg: 4,
  /** Seconds after done before the item burns. */
  burnAfter: 5,
  chopHits: 3,
};

export const SCORE = {
  /** Extra coins for serving with patience left, scaled 0..1 of patience. */
  maxTip: 6,
  comboStep: 0.25,
  comboMax: 3,
};

/** Freshness: a prepared ingredient stays FRESH for this many seconds after it
 * is chopped or grilled. Serve a dish built only from fresh items and it pays
 * a FRESH BONUS on top of the tip; serve with a stale item in it and the tip
 * is gone. Freshness is the game's one twist: prepping ahead is fast, but
 * only just-in-time cooking pays full price. */
export const FRESH_SECONDS = 25;
export const FRESH_BONUS = 3;
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 58 },
  orderBoard: { x: 16, y: 66, w: 1248, h: 118 },
  // Ingredient bins: one column on the left wall.
  bins: { x: 16, y: 200, w: 136, h: 536 },
  // Chopping board, grill and assembly counter across the top.
  board: { x: 300, y: 200, w: 240, h: 120 },
  grill: { x: 570, y: 200, w: 280, h: 120 },
  plate: { x: 880, y: 200, w: 384, h: 120 },
  // Serving window bottom-right, trash bottom-middle.
  window: { x: 880, y: 560, w: 384, h: 176 },
  trash: { x: 300, y: 640, w: 240, h: 96 },
  // The walkable floor the chef moves on (bins/counters are walls).
  floor: { x: 16, y: 200, w: 1248, h: 560 },
};

/** Ingredient bins: ONE column on the left wall, so the chef can stand right
 * beside every bin (a two-column block left the inner column out of reach). */
export const BINS = [
  { id: 'bun', label: 'BUN', x: 28, y: 212, w: 120, h: 60 },
  { id: 'patty', label: 'PATTY', x: 28, y: 278, w: 120, h: 60 },
  { id: 'tomato', label: 'TOMATO', x: 28, y: 344, w: 120, h: 60 },
  { id: 'lettuce', label: 'LETTUCE', x: 28, y: 410, w: 120, h: 60 },
  { id: 'cheese', label: 'CHEESE', x: 28, y: 476, w: 120, h: 60 },
  { id: 'noodle', label: 'NOODLE', x: 28, y: 542, w: 120, h: 60 },
  { id: 'egg', label: 'EGG', x: 28, y: 608, w: 120, h: 60 },
  { id: 'sauce', label: 'SAUCE', x: 28, y: 674, w: 120, h: 60 },
];

/** Grill slots (two patties/eggs at once). */
export const GRILL_SLOTS = [
  { x: 596, y: 238, w: 110, h: 68 },
  { x: 720, y: 238, w: 110, h: 68 },
];

/** Where the two chopped piles wait on the board. */
export const BOARD_SLOTS = [
  { x: 318, y: 222, w: 100, h: 76 },
  { x: 430, y: 222, w: 100, h: 76 },
];

export const PALETTE = {
  wall: '#2e1d12',
  wallTile: '#4a2f1d',
  wallTileLight: '#5d3d24',
  floor: '#c08a54',
  floorDark: '#a9763f',
  floorTile: '#d9ab72',
  floorTileDark: '#b57e46',
  floorLine: '#8f6234',
  rug: '#a33327',
  rugEdge: '#e8b64c',
  rugInner: '#c65a3c',
  topBar: '#241610',
  board: '#1d120b',
  boardEdge: '#5d3d24',
  counter: '#7d4f27',
  counterTop: '#a9743f',
  counterEdge: '#e8b64c',
  steel: '#c7ccd2',
  steelDark: '#7d838a',
  grill: '#33373d',
  grillHot: '#e2574b',
  window: '#4a2a16',
  windowWarm: '#f2a93c',
  text: '#fff6e8',
  muted: '#d8c3a5',
  gold: '#f2c94c',
  green: '#7bc96f',
  freshGreen: '#8ee06a',
  staleBrown: '#8a6a42',
  red: '#e5534b',
  ticket: '#fff3d6',
  ticketDone: '#cfe8b8',
  chefHat: '#f5f2ea',
  chefSkin: '#f0c08c',
  chefShirt: '#e2574b',
  chefApron: '#f5f2ea',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best shift total is kept between visits (this browser only). */
export const BEST_KEY = 'ember-kitchen-best';
