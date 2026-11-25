// The recipe book: every dish Ember Kitchen serves, what it is made of, and how
// each ingredient is prepared. An ingredient id names one bin; `prep` says what the
// chef must do with it before it can go on the plate.
import { pick } from './random.js';

/** Ingredient catalogue: label, base colour, and how it is prepared. */
export const INGREDIENTS = {
  bun: { label: 'Bun', colour: '#e8a94f', prep: 'raw' },
  patty: { label: 'Patty', colour: '#7a4a2b', prep: 'grill' },
  tomato: { label: 'Tomato', colour: '#e5534b', prep: 'chop' },
  lettuce: { label: 'Lettuce', colour: '#7bc96f', prep: 'chop' },
  cheese: { label: 'Cheese', colour: '#f2c94c', prep: 'raw' },
  noodle: { label: 'Noodle', colour: '#f0d060', prep: 'raw' },
  egg: { label: 'Egg', colour: '#fff3d6', prep: 'grill' },
  sauce: { label: 'Sauce', colour: '#d96a2b', prep: 'raw' },
};

/**
 * One recipe: the dish name, its coins, and the plate contents in build order.
 * An entry is an ingredient id; `cooked` means the grilled/fried version of it.
 */
export const RECIPES = [
  {
    id: 'classic-burger',
    name: 'Classic Burger',
    coins: 12,
    needs: ['bun', 'patty:cooked', 'lettuce:chopped', 'tomato:chopped'],
  },
  {
    id: 'cheeseburger',
    name: 'Cheeseburger',
    coins: 13,
    needs: ['bun', 'patty:cooked', 'cheese', 'tomato:chopped'],
  },
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    coins: 8,
    needs: ['lettuce:chopped', 'tomato:chopped', 'cheese'],
  },
  {
    id: 'noodle-bowl',
    name: 'Noodle Bowl',
    coins: 11,
    needs: ['noodle', 'egg:cooked', 'tomato:chopped', 'sauce'],
  },
  {
    id: 'breakfast-stack',
    name: 'Breakfast Stack',
    coins: 10,
    needs: ['bun', 'egg:cooked', 'cheese'],
  },
  {
    id: 'veggie-melt',
    name: 'Veggie Melt',
    coins: 11,
    needs: ['bun', 'lettuce:chopped', 'tomato:chopped', 'cheese'],
  },
];

/** The plate key of an ingredient in a given state, e.g. 'patty:cooked'. */
export function plateKey(id, state) {
  return state === 'plain' ? id : `${id}:${state}`;
}

/** The state a prepared ingredient is in once it may go on the plate. */
export function readyState(id) {
  const prep = INGREDIENTS[id].prep;
  if (prep === 'chop') return 'chopped';
  if (prep === 'grill') return 'cooked';
  return 'plain';
}

/** True when the plate contents match the recipe exactly (order ignored). */
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const sortedPlate = [...plate].sort();
  const sortedNeeds = [...recipe.needs].sort();
  return sortedPlate.every((key, index) => key === sortedNeeds[index]);
}

/** True when every item on the plate belongs to the recipe (a partial build). */
export function plateFitsRecipe(plate, recipe) {
  const needs = [...recipe.needs];
  return plate.every((key) => {
    const at = needs.indexOf(key);
    if (at < 0) return false;
    needs.splice(at, 1);
    return true;
  });
}

/**
 * Draw a new ticket. Every recipe can appear at any time — variety is the point:
 * the tickets must show the whole menu, not one dish four times. The pressure
 * grows through faster spawns and shorter patience, not through harder recipes.
 */
export function drawOrder(random, elapsed, day) {
  const recipe = pick(random, RECIPES);
  return { recipe, bornAt: elapsed };
}

/** A short serving line for the dish, shown on its ticket. */
export function dishTagline(recipe) {
  const lines = {
    'classic-burger': 'The house favourite',
    cheeseburger: 'Double the melt',
    'garden-salad': 'Light and fresh',
    'noodle-bowl': 'Slurp it hot',
    'breakfast-stack': 'All-day breakfast',
    'veggie-melt': 'Garden on a bun',
  };
  return lines[recipe.id] ?? 'Fresh off the pass';
}
