// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play, paused
// and game over.
//
// ?seed=N fixes the order pattern. ?shot=cover|rush|chop|serve (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, SHIFT_SECONDS, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BURNT, EVENT_CHOP, EVENT_COOKED, EVENT_ERROR, EVENT_MISSED, EVENT_OVER, EVENT_PLACE, EVENT_PICKUP, EVENT_RUSH, EVENT_SERVED, EVENT_TRASH } from './world.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas);

let screen = SCREEN_TITLE;
let best = readBest();
let time = 0;
let last = performance.now();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest() {
  try {
    window.localStorage.setItem(BEST_KEY, String(best));
  } catch {
    /* private mode or no storage: the best score just does not persist */
  }
}

/** One world event bit -> its sound. */
function playEvents(events) {
  if (events & EVENT_SERVED) audio.play('served');
  else if (events & EVENT_MISSED) audio.play('missed');
  else if (events & EVENT_BURNT) audio.play('burnt');
  else if (events & EVENT_RUSH) audio.play('rush');
  else if (events & EVENT_OVER) audio.play('over');
  else if (events & EVENT_CHOP) audio.play('chop');
  else if (events & EVENT_COOKED) audio.play('cooked');
  else if (events & EVENT_PICKUP) audio.play('pickup');
  else if (events & EVENT_PLACE) audio.play('place');
  else if (events & EVENT_TRASH) audio.play('trash');
  else if (events & EVENT_ERROR) audio.play('error');
  audio.setSizzle(world.state.sizzle > 0 && screen === SCREEN_PLAY);
}

/** The screen-reader line announcing the shift. */
function announce() {
  const s = world.state;
  const left = Math.max(0, SHIFT_SECONDS - s.elapsed);
  status.textContent =
    screen === SCREEN_TITLE
      ? 'Ember Kitchen. Press Enter to start your shift.'
      : screen === SCREEN_OVER
        ? `Shift over. You earned $${s.coins}, served ${s.served} dishes.`
        : `Day ${s.day}. $${s.coins} earned, ${s.served} served, ${s.missed} missed, ${Math.ceil(left)} seconds left.`;
}

function frame(now) {
  const frameDt = Math.min(MAX_FRAME, (now - last) / 1000);
  last = now;
  time += frameDt;
  const pressed = input.read();

  if (pressed.mute) {
    audio.toggleMute();
  }

  if (screen === SCREEN_TITLE) {
    if (pressed.confirm) {
      audio.unlock();
      screen = SCREEN_PLAY;
      input.clearPressed();
    }
  } else if (screen === SCREEN_PLAY) {
    if (pressed.pause) {
      screen = SCREEN_PAUSED;
      audio.setSizzle(false);
    } else {
      let accumulated = 0;
      let events = 0;
      while (accumulated < frameDt) {
        events |= world.step(STEP, pressed);
        accumulated += STEP;
      }
      playEvents(events);
      if (world.state.over) {
        best = Math.max(best, world.state.coins);
        saveBest();
        screen = SCREEN_OVER;
      }
    }
  } else if (screen === SCREEN_PAUSED) {
    if (pressed.pause || pressed.confirm) screen = SCREEN_PLAY;
  } else if (screen === SCREEN_OVER) {
    if (pressed.restart) {
      world.nextDay();
      screen = SCREEN_PLAY;
      input.clearPressed();
    } else if (pressed.confirm) {
      const fresh = createWorld(createRandom(Math.floor(Math.random() * 4294967296)));
      Object.assign(world, fresh);
      screen = SCREEN_PLAY;
      input.clearPressed();
    }
  }

  const stationName = world.stationName(world.state.near);
  renderer.draw(world.state, screen, best, time, stationName);
  announce();
  requestAnimationFrame(frame);
}

if (shot) {
  // Screenshot mode: stage the scene and keep repainting it frozen. The paint
  // runs on animation frames (not once at module time) so a late resize, which
  // resets the canvas, cannot leave a blank frame behind.
  try {
    const staged = stageShot(shot, world);
    const paint = () => {
      const stationName = world.stationName(world.state.near);
      renderer.draw(world.state, staged.screen, best, 1.2, stationName);
      requestAnimationFrame(paint);
    };
    renderer.draw(world.state, staged.screen, best, 1.2, world.stationName(world.state.near));
    window.__shotReady = true;
    requestAnimationFrame(paint);
  } catch (error) {
    document.title = 'SHOT ERR ' + error.message + ' :: ' + String(error.stack).slice(0, 500);
  }
} else {
  requestAnimationFrame(frame);
}
