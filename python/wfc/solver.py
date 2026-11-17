"""Wave function collapse over a TileSet.

Each cell holds its remaining options as a bitmask. Collapsing a cell ripples
outward through every neighbour whose options shrink (full propagation), so
dead ends show up immediately. On a dead end the attempt restarts with a new
seed derived from the first one, so a seed always gives the same picture.

weight_fn(x, y, variant_index) -> multiplier is the hook for steering the
picture, e.g. by an image's brightness (see picture.py). Return 0 to forbid a tile in a cell.

options_at_collapse[idx] records how many options each cell still had when it
was decided: 1 means its neighbours forced it, more means it was a free pick.
"""

import heapq
import random


class Contradiction(Exception):
    pass


class Solver:
    def __init__(self, tileset, width, height, seed=None, weight_fn=None, max_attempts=100):
        self.ts = tileset
        self.w, self.h = width, height
        self.seed = random.randrange(10**6) if seed is None else seed
        self.weight_fn = weight_fn
        self.max_attempts = max_attempts
        self.attempt = 0
        self._allowed = {}  # (mask, direction) -> union of compatible masks

    # -- public -----------------------------------------------------------

    def solve(self):
        """Run to completion. Returns a list of variant indices, row by row."""
        for _ in self.steps():
            pass
        return self.result()

    def steps(self):
        """Generator for animation. Yields ("restart", None) when an attempt
        fails and starts over, or ("cells", [index, ...]) for cells decided by
        one collapse and its ripple."""
        while self.attempt < self.max_attempts:
            try:
                self._reset(self.attempt)
                while True:
                    idx = self._lowest_entropy()
                    if idx is None:
                        return
                    self._collapse(idx)
                    decided, self._decided = self._decided, []
                    yield "cells", decided
            except Contradiction:
                self.attempt += 1
                yield "restart", None
        raise RuntimeError(f"no solution in {self.max_attempts} attempts (seed {self.seed})")

    def result(self):
        return [m.bit_length() - 1 for m in self.cells]

    # -- internals --------------------------------------------------------

    def _reset(self, attempt):
        self.rng = random.Random(f"{self.seed}:{attempt}")
        full = (1 << len(self.ts)) - 1
        self.cells = [full] * (self.w * self.h)
        self.done = [False] * (self.w * self.h)
        self.options_at_collapse = [0] * (self.w * self.h)
        self._decided = []
        self._heap = []
        if self.weight_fn:  # cells where weight_fn forbids tiles start narrowed
            for idx in range(len(self.cells)):
                x, y = idx % self.w, idx // self.w
                mask = full
                for v in range(len(self.ts)):
                    if self.weight_fn(x, y, v) <= 0:
                        mask &= ~(1 << v)
                if mask != full:
                    self.cells[idx] = mask
                    self._propagate(idx)
        for idx, m in enumerate(self.cells):
            self._push(idx, m)

    def _push(self, idx, mask):
        heapq.heappush(self._heap, (mask.bit_count(), self.rng.random(), idx))

    def _lowest_entropy(self):
        while self._heap:
            count, _, idx = heapq.heappop(self._heap)
            if self.done[idx] or count != self.cells[idx].bit_count():
                continue  # stale entry
            if count == 1:
                self._finish(idx)
                continue
            return idx
        return None

    def _collapse(self, idx):
        mask = self.cells[idx]
        options = [v for v in range(len(self.ts)) if mask >> v & 1]
        x, y = idx % self.w, idx // self.w
        weights = [self.ts.variants[v].weight * (self.weight_fn(x, y, v) if self.weight_fn else 1)
                   for v in options]
        if sum(weights) <= 0:
            weights = None
        pick = self.rng.choices(options, weights=weights)[0]
        self.cells[idx] = 1 << pick
        self._finish(idx, len(options))
        self._propagate(idx)

    def _finish(self, idx, options=1):
        if not self.done[idx]:
            self.done[idx] = True
            self.options_at_collapse[idx] = options
            self._decided.append(idx)

    def _allowed_from(self, mask, d):
        key = (mask, d)
        a = self._allowed.get(key)
        if a is None:
            a, m, v = 0, mask, 0
            while m:
                if m & 1:
                    a |= self.ts.compat[v][d]
                m >>= 1
                v += 1
            self._allowed[key] = a
        return a

    def _propagate(self, start):
        w, h, cells = self.w, self.h, self.cells
        stack = [start]
        while stack:
            idx = stack.pop()
            x, y = idx % w, idx // w
            mask = cells[idx]
            for d, (nx, ny) in enumerate(((x, y - 1), (x + 1, y), (x, y + 1), (x - 1, y))):
                if not (0 <= nx < w and 0 <= ny < h):
                    continue
                n = nx + ny * w
                new = cells[n] & self._allowed_from(mask, d)
                if new != cells[n]:
                    if not new:
                        raise Contradiction
                    cells[n] = new
                    self._push(n, new)
                    stack.append(n)
