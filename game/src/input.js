// Keyboard and mouse, read every frame. WASD/arrows move, E or Space interacts,
// Enter starts, P pauses, R starts the next day, M mutes. A mouse click sets a
// walk target; clicking a station walks there and uses it on arrival.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_NEXT_DAY = 'nextDay';
export const ACTION_MUTE = 'mute';

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let click = null;
  let clickStation = null;

  function keyName(event) {
    const key = event.key.toLowerCase();
    if (key === ' ') return 'space';
    return key;
  }

  window.addEventListener('keydown', (event) => {
    const key = keyName(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(key);
    keys.add(key);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(keyName(event));
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    clickStation = true;
  });

  function takePressed(name) {
    if (pressed.has(name)) {
      pressed.delete(name);
      return true;
    }
    return false;
  }

  /** Read this frame's input. `click` is consumed (one frame only). */
  function read() {
    const input = {
      left: keys.has('a') || keys.has('arrowleft'),
      right: keys.has('d') || keys.has('arrowright'),
      up: keys.has('w') || keys.has('arrowup'),
      down: keys.has('s') || keys.has('arrowdown'),
      interact: takePressed('e') || takePressed('space'),
      click: clickStation ? click : null,
      confirm: takePressed('enter'),
      pause: takePressed('p'),
      restart: takePressed('r'),
      mute: takePressed('m'),
    };
    click = null;
    clickStation = false;
    return input;
  }

  /** Drop the queued one-frame presses (used when switching screens). */
  function clearPressed() {
    pressed.clear();
    click = null;
    clickStation = false;
  }

  return { read, clearPressed };
}
