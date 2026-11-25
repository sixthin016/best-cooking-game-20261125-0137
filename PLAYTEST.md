# Ember Kitchen — playtest

Generated 2026-11-25T04:37:23.358Z by `node tools/playtest.mjs` (headless Node, same world.js the game ships).

## Full-shift bot play (greedy policy: serve the first ticket, one ingredient at a time)

| seed | steps | coins | served | missed | best combo | interacts | errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 | 6036 | $37 | 3 | 3 | x2 | 68 | 0 |
| 42 | 5856 | $34 | 3 | 3 | x2 | 68 | 0 |

## Step time (wall clock per world.step call, 60 steps/s simulation)

| seed | p50 | p95 | max |
| --- | --- | --- | --- |
| 11 | 0.0044 ms | 0.0124 ms | 0.945 ms |
| 42 | 0.0033 ms | 0.0118 ms | 2.0643 ms |

A 60 FPS frame has a 16.7 ms budget; p95 step time is ~100x inside it, so the
simulation cannot be the frame-rate bottleneck on any modern machine.

## Input latency

Every interact is applied in the same world.step call that receives it: the
bot issues useStation and the effect (pickup/place/chop/serve) lands in that
same tick, so input-to-effect latency is 1 simulation step (16.7 ms). No
input queue, no deferred actions. Verified by the bot above: 0 errors across
136 station uses in 2 shifts.

## Freshness checks

- [x] chopped item gets fresh=25s
- [x] freshness decays to 0 after 27s idle
- [x] stale serve pays base coins only (8, no tip, no bonus)
- [x] all-fresh serve pays 8 + 6 tip + 3 bonus = 17

## Determinism

- Same seed (11) twice: IDENTICAL (coins $37, served 3, missed 3).
