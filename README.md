# Blackjack Trainer

An Angular blackjack basic strategy trainer. The app always plays as a simulation: player decisions are checked against the selected strategy, correct choices continue the hand, and incorrect choices lock that hand as a dealer win while the dealer still follows table rules.

## Run

```bash
npm install
npm start
```

Then open the local URL printed by Angular, usually `http://localhost:4200/`.

## Current scope

- Angular 21 standalone app
- Strategy-gated blackjack simulation
- Hit, stand, double, and split
- Dealer rule support for H17/S17
- Strategy selector
- $100 bankroll, $5 base wager, reset control
- Fresh shuffled shoe per hand, with a `shoe` state shape that can later support tracked shoe usage

## Strategy data

The first prototype includes two built-in rulesets:

- 6 Deck H17 DAS
- Single Deck S17

The strategy lookup currently uses a compact basic-strategy decision function. The next step is to move these into explicit JSON strategy tables so multiple casino rule sets can be added and tested independently.
