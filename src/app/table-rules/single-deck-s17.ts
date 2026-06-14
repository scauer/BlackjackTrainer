import type { TableRules } from '../rule-types';

export const singleDeckS17 = {
  id: 'single-deck-s17',
  name: 'Single Deck S17',
  decks: 1,
  dealerHitsSoft17: false,
  doubleAfterSplit: true,
  surrenderAllowed: false,
  blackjackPayout: 1.5,
  maxSplitHands: 4,
  doubleAllowedOn: 'any',
} satisfies TableRules;
