# Emergent Artist

**Emergent Artist** is an experimental generative-art system built around autonomous visual agents.

Instead of directly generating a composition, independent drawing agents move through a shared canvas, respond to their surroundings, and decide when and how to leave marks.

A higher-level **Artist Agent** periodically observes the evolving artwork and changes the conditions under which those agents operate.

The central idea is simple:

> **Don't program the composition. Build a world in which the composition can discover itself.**

---

## Concept

The system contains visual agent species such as:

```text
CircleAgent
LineAgent
TriangleAgent
SquareAgent
TextAgent
...
```

There can be zero or many agents of any species.

Each individual agent has its own personality.

For example, two CircleAgents might behave very differently:

```text
Circle A
large
pale
slow
hesitant
watercolor

Circle B
small
dark
fast
repetitive
ink
```

Agents wander through the canvas, perceive local conditions, respond to environmental influences, and occasionally make marks.

---

## The Artist Agent

The Artist Agent does not normally draw.

Instead, it periodically analyzes the evolving composition and influences the system.

It might observe:

```text
too much activity in the upper-left
unused negative space in the lower-right
too many circles
weak directional movement
excessive repetition
```

Rather than explicitly fixing those problems, it changes environmental pressures.

For example:

```text
reduce CircleAgent population
encourage LineAgents
increase activity in the lower-right
protect an area of negative space
increase scale variation
```

The element agents decide how those influences become actual marks.

This creates a feedback loop:

```text
Emergence
    ↓
Observation
    ↓
Influence
    ↓
New Emergence
    ↺
```

---

## Agent Model

Each agent consists of three separate concepts.

### Species

What visual language does the agent speak?

```text
circle
line
triangle
text
...
```

### Personality

How does this particular individual behave?

```text
large / small
light / heavy
smooth / rough
quiet / aggressive
slow / fast
social / solitary
repetitive / exploratory
precise / squiggly
```

### State

What is happening to the agent right now?

```text
position
velocity
age
energy
nearby agents
local density
recent marks
environmental influence
```

---

## Renderers

Drawing behavior is separated from drawing technique.

Agents decide what kind of mark they want to make.

Renderers decide how that mark looks.

Potential renderers include:

```text
InkRenderer
BrushRenderer
WatercolorRenderer
PencilRenderer
VectorRenderer
```

This means the same CircleAgent behavior could produce an ink circle, watercolor bloom, brush gesture, or pencil mark.

---

## Influence Fields

The Artist Agent communicates primarily through invisible spatial fields.

Examples include:

```text
Attraction
Repulsion
Interest
Density
Direction
Scale
Drawing Probability
```

Agents may respond differently to the same field depending upon their personalities.

The Artist therefore influences the composition without completely controlling it.

---

## Evolution

Future versions may allow agents to:

```text
reproduce
die
mutate
inherit traits
compete
cooperate
```

An Artist Agent might indirectly favor certain personalities because their marks are helping the composition.

Over time, the population itself could evolve.

A species may even become extinct during a painting.

---

## Relationship to Abstract Artist

Emergent Artist grew conceptually from experiments developed in **Abstract Artist**.

Useful ideas and infrastructure may be adapted from that project, including:

- palettes
- canvas handling
- paper textures
- watercolor rendering
- ink rendering
- compositional analysis
- artistic intent

Emergent Artist is intentionally a separate project because its fundamental architecture is different.

Abstract Artist generates compositions.

Emergent Artist explores whether compositions can **emerge from a society of visual agents**.

---

## Initial Scope

The first implementation should remain intentionally small.

### Agents

```text
CircleAgent
LineAgent
```

### Initial personality traits

```text
scale
opacity
weight
roughness
speed
wander
drawing frequency
curiosity
```

### Initial Artist observations

```text
regional density
negative space
repetition
visual center of mass
```

### Initial Artist influences

```text
population
drawing probability
scale
attraction
repulsion
```

The first objective is not to produce polished artwork.

The first objective is to answer:

> **Can the system begin making compositional decisions that were not explicitly programmed?**

---

## Development Philosophy

Keep individual agents understandable.

Allow complexity to emerge from their interaction.

Prefer environmental influence over direct commands.

Avoid adding visual species simply for variety until the underlying behavioral system is interesting.

Make internal behavior visible and debuggable.

Use seeded randomness so interesting runs can be reproduced.

Most importantly:

**Follow surprising behavior.**

If the system starts doing something visually interesting that wasn't anticipated, investigate it before trying to "fix" it.

---

## Status

**Concept / architecture stage**

Planned first milestone:

> Autonomous CircleAgents and LineAgents with distinct personalities moving and drawing on a shared canvas.

See `DESIGN.md` for the full architecture and development roadmap.