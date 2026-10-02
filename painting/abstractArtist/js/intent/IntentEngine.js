class IntentEngine {
  constructor(intents, settings = {}) {
    this.intents = intents;
    this.names = Object.keys(intents);
    this.settings = settings;
  }

  chooseIntent(name = null) {
    if (name && this.intents[name]) {
      return this._withCompositionBias(this._copy(this.intents[name]));
    }

    const chosenName = random(this.names);
    return this._withCompositionBias(this._copy(this.intents[chosenName]));
  }

  getIntentNames() {
    return [...this.names];
  }

  getAdjacentIntentName(currentName, direction = 1) {
    const currentIndex = Math.max(0, this.names.indexOf(currentName));
    const nextIndex = (currentIndex + direction + this.names.length) % this.names.length;
    return this.names[nextIndex];
  }

  _withCompositionBias(intent) {
    const c = this.settings.composition || {};

    // These are compositional interpretations of expressive forces.
    // They remain upstream of rendering and are intentionally probabilistic.
    intent.compositionBias = {
      negativeSpace: this._map01(
        intent.isolation,
        c.negativeSpaceMin ?? 0.18,
        c.negativeSpaceMax ?? 0.52
      ),

      spread: this._map01(
        intent.isolation,
        c.spreadMin ?? 0.72,
        c.spreadMax ?? 1.34
      ),

      scaleContrast: this._map01(
        intent.tension,
        c.scaleContrastMin ?? 0.72,
        c.scaleContrastMax ?? 1.32
      ),

      overlap: this._clamp01(
        (intent.tension * 0.72) + ((1 - intent.isolation) * 0.28)
      ),

      clusterTightness: this._clamp01(
        (intent.harmony * 0.62) + ((1 - intent.isolation) * 0.38)
      ),

      irregularity: this._clamp01(
        (intent.ambiguity * 0.52) + (intent.fragility * 0.48)
      ),

      asymmetry: this._clamp01(
        0.42 + intent.tension * 0.34 + intent.isolation * 0.24
      ),

      rhythmDensity: this._clamp01(
        intent.energy * 0.72 + (1 - intent.isolation) * 0.28
      ),

      secondaryCount: Math.round(
        this._map01(
          this._clamp01(intent.energy * 0.65 + (1 - intent.isolation) * 0.35),
          c.secondaryCountMin ?? 2,
          c.secondaryCountMax ?? 5
        )
      )
    };

    return intent;
  }

  _map01(value, min, max) {
    return min + (max - min) * this._clamp01(value);
  }

  _clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  _copy(intent) {
    return JSON.parse(JSON.stringify(intent));
  }
}
