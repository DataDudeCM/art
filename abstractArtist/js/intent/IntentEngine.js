class IntentEngine {
  constructor(intents) {
    this.intents = intents;
    this.names = Object.keys(intents);
  }

  chooseIntent(name = null) {
    if (name && this.intents[name]) {
      return this._copy(this.intents[name]);
    }

    const chosenName = random(this.names);
    return this._copy(this.intents[chosenName]);
  }

  _copy(intent) {
    return JSON.parse(JSON.stringify(intent));
  }
}
