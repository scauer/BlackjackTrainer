export type Action = 'hit' | 'stand' | 'double' | 'split';
export type DealerRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'A';
export type StrategyTable = Record<string, Partial<Record<DealerRank, Action>>>;

export interface TableRules {
  id: string;
  name: string;
  decks: number;
  dealerHitsSoft17: boolean;
  doubleAfterSplit: boolean;
  surrenderAllowed: boolean;
  blackjackPayout: number;
  maxSplitHands: number;
  doubleAllowedOn: 'any';
}

export interface BasicStrategy {
  id: string;
  name: string;
  hard: StrategyTable;
  soft: StrategyTable;
  pairs: StrategyTable;
}
