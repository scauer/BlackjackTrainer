import type { TableRules } from '../rule-types';

export const sixDeckH17Das = {
  id: 'six-deck-h17-das',
  name: '6 Deck H17 DAS',
  decks: 6,
  dealerHitsSoft17: true,
  doubleAfterSplit: true,
  surrenderAllowed: false,
  blackjackPayout: 1.5,
  maxSplitHands: 4,
  doubleAllowedOn: 'any',
} satisfies TableRules;
