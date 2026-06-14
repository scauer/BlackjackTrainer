import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Action, BasicStrategy, DealerRank, StrategyTable, TableRules } from './rule-types';
import { defaultBasicStrategy } from './strategies/default-basic';
import { singleDeckS17 } from './table-rules/single-deck-s17';
import { sixDeckH17Das } from './table-rules/six-deck-h17-das';

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
type Result = 'won' | 'lost' | 'push' | 'blackjack' | null;
type ViewMode = 'game' | 'deck' | 'chart';

interface Card {
  rank: Rank;
  suit: Suit;
}

interface Strategy {
  id: string;
  name: string;
  tableRules: TableRules;
  basicStrategy: BasicStrategy;
}

interface PlayerHand {
  cards: Card[];
  wager: number;
  completed: boolean;
  failed: boolean;
  doubled: boolean;
  result: Result;
}

interface Round {
  dealerHand: Card[];
  playerHands: PlayerHand[];
  activeHandIndex: number;
  completed: boolean;
  dealerRevealed: boolean;
}

const STARTING_BANKROLL = 100;
const BASE_WAGER = 5;
const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const DEALER_RANKS: DealerRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
const HARD_TOTALS = ['17+', '16', '15', '14', '13', '12', '11', '10', '9'];
const SOFT_TOTALS = ['20+', '19', '18', '17', '16', '15', '14', '13'];
const PAIR_TOTALS = ['A', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const TABLE_RULES: TableRules[] = [sixDeckH17Das, singleDeckS17];
const BASIC_STRATEGY: BasicStrategy = defaultBasicStrategy;
const STRATEGIES: Strategy[] = TABLE_RULES.map((tableRules) => ({
  id: tableRules.id,
  name: tableRules.name,
  tableRules,
  basicStrategy: BASIC_STRATEGY,
}));

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly startingBankroll = STARTING_BANKROLL;
  readonly baseWager = BASE_WAGER;
  readonly dealerRanks = DEALER_RANKS;
  readonly strategies = STRATEGIES;

  selectedStrategyId = this.strategies[0].id;
  viewMode: ViewMode = 'game';
  bankroll = STARTING_BANKROLL;
  shoe: Card[] = [];
  round: Round | null = null;
  message = 'Deal a hand to begin.';
  hint = '';
  history: string[] = [];
  stats = {
    handsPlayed: 0,
    correctMoves: 0,
    mistakes: 0,
    streak: 0,
  };

  get strategy(): Strategy {
    return this.strategies.find((item) => item.id === this.selectedStrategyId) ?? this.strategies[0];
  }

  get tableRules(): TableRules {
    return this.strategy.tableRules;
  }

  get basicStrategy(): BasicStrategy {
    return this.strategy.basicStrategy;
  }

  get activeHand(): PlayerHand | null {
    return this.round?.playerHands[this.round.activeHandIndex] ?? null;
  }

  get canAct(): boolean {
    return Boolean(this.round && !this.round.completed && this.activeHand && !this.activeHand.completed);
  }

  get dealerTotalLabel(): string {
    if (!this.round) return 'Upcard';
    if (this.round.dealerRevealed) return String(this.handValue(this.round.dealerHand).total);
    return `Upcard ${this.normalizeDealerRank(this.round.dealerHand[0])}`;
  }

  get playerTotalLabel(): string {
    return this.activeHand ? String(this.handValue(this.activeHand.cards).total) : 'Total';
  }

  get rulesRows(): [string, string][] {
    return [
      ['Decks', String(this.tableRules.decks)],
      ['Dealer soft 17', this.tableRules.dealerHitsSoft17 ? 'Hits' : 'Stands'],
      ['Double after split', this.tableRules.doubleAfterSplit ? 'Yes' : 'No'],
      ['Blackjack pays', this.tableRules.blackjackPayout === 1.5 ? '3:2' : '6:5'],
      ['Base wager', this.money(BASE_WAGER)],
      ['Shoe mode', 'Fresh each hand'],
    ];
  }

  get testDeck(): Card[] {
    return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
  }

  get chartSections(): { title: string; rows: string[]; table: StrategyTable }[] {
    return [
      { title: 'Hard Totals', rows: HARD_TOTALS, table: this.basicStrategy.hard },
      { title: 'Soft Totals', rows: SOFT_TOTALS, table: this.basicStrategy.soft },
      { title: 'Pairs', rows: PAIR_TOTALS, table: this.basicStrategy.pairs },
    ];
  }

  toggleDeckTest(): void {
    this.viewMode = this.viewMode === 'game' ? 'deck' : 'game';
  }

  toggleStrategyChart(): void {
    this.viewMode = this.viewMode === 'chart' ? 'game' : 'chart';
  }

  selectStrategy(event: Event): void {
    this.selectedStrategyId = (event.target as HTMLSelectElement).value;
    this.round = null;
    this.setMessage('Strategy changed. Deal a hand to begin.', '');
  }

  resetBankroll(): void {
    this.bankroll = STARTING_BANKROLL;
    this.stats = { handsPlayed: 0, correctMoves: 0, mistakes: 0, streak: 0 };
    this.history = [];
    this.round = null;
    this.setMessage('Bankroll reset. Deal a hand to begin.', '');
  }

  startRound(): void {
    if (this.bankroll < BASE_WAGER) {
      this.setMessage('Reset your bankroll to keep playing.', '');
      return;
    }

    this.shoe = this.buildShoe(this.tableRules.decks);
    this.round = {
      dealerHand: [this.drawCard(), this.drawCard()],
      playerHands: [this.createHand([this.drawCard(), this.drawCard()], BASE_WAGER)],
      activeHandIndex: 0,
      completed: false,
      dealerRevealed: false,
    };

    const firstHand = this.round.playerHands[0];
    if (this.isBlackjack(firstHand.cards) || this.isBlackjack(this.round.dealerHand)) {
      this.round.dealerRevealed = true;
      this.finishCleanRound();
      return;
    }

    this.setMessage('Choose the basic strategy play.', '');
  }

  playerAction(action: Action): void {
    const round = this.round;
    const hand = this.activeHand;
    if (!round || round.completed || !hand || hand.completed) return;

    const expected = this.correctAction(hand, round.dealerHand[0]);
    if (action !== expected) {
      this.stats.mistakes += 1;
      this.stats.streak = 0;
      if (action === 'hit') hand.cards.push(this.drawCard());
      hand.failed = true;
      hand.completed = true;
      this.forceDealerWin(hand, action, expected);
      return;
    }

    this.stats.correctMoves += 1;
    this.stats.streak += 1;

    if (action === 'hit') {
      hand.cards.push(this.drawCardForPlayer(hand) ?? this.drawCard());
      if (this.handValue(hand.cards).total > 21) {
        hand.completed = true;
        hand.result = 'lost';
        this.setMessage('Correct hit, but the hand busted.', '');
        this.advanceOrFinish();
      } else {
        this.setMessage('Correct. Choose the next play.', '');
      }
      return;
    }

    if (action === 'stand') {
      hand.completed = true;
      this.setMessage('Correct stand. Dealer plays next.', '');
      this.advanceOrFinish();
      return;
    }

    if (action === 'double') {
      hand.wager *= 2;
      hand.doubled = true;
      hand.cards.push(this.drawCardForPlayer(hand) ?? this.drawCard());
      hand.completed = true;
      this.setMessage('Correct double. One card dealt.', '');
      this.advanceOrFinish();
      return;
    }

    if (action === 'split') {
      const [first, second] = hand.cards;
      hand.cards = [first, this.drawCardForPlayer(this.createHand([first], hand.wager)) ?? this.drawCard()];
      hand.completed = false;
      const splitHand = this.createHand([second], hand.wager);
      splitHand.cards.push(this.drawCardForPlayer(splitHand) ?? this.drawCard());
      round.playerHands.splice(round.activeHandIndex + 1, 0, splitHand);
      this.setMessage('Correct split. Play the highlighted hand.', '');
    }
  }

  canSplit(hand: PlayerHand | null): boolean {
    return Boolean(
      this.round &&
        hand &&
        hand.cards.length === 2 &&
        this.isPair(hand.cards) &&
        this.round.playerHands.length < this.tableRules.maxSplitHands,
    );
  }

  canDouble(hand: PlayerHand | null): boolean {
    return Boolean(hand && hand.cards.length === 2 && !hand.completed);
  }

  chartAction(table: StrategyTable, row: string, dealer: DealerRank): string {
    return this.label(table[row]?.[dealer] ?? 'hit');
  }

  cardLabel(card: Card): string {
    const suit = this.suitSymbol(card);
    return `${card.rank}${suit}`;
  }

  suitSymbol(card: Card): string {
    return { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[card.suit];
  }

  cardClass(card: Card, hidden = false): string {
    return [
      'card',
      hidden ? 'hidden' : '',
      card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : '',
    ].join(' ');
  }

  cardImageSrc(card: Card, hidden = false): string {
    return `assets/svg-cards/${hidden ? 'back-blue' : this.cardAssetName(card)}.png`;
  }

  private cardAssetName(card: Card): string {
    const suit = { spades: 'spade', hearts: 'heart', diamonds: 'diamond', clubs: 'club' }[card.suit];
    const rank: Record<Rank, string> = {
      A: '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
      '8': '8',
      '9': '9',
      '10': '10',
      J: 'jack',
      Q: 'queen',
      K: 'king',
    };
    return `${suit}_${rank[card.rank]}`;
  }

  handClasses(hand: PlayerHand, index: number): string {
    return [
      'hand',
      index === this.round?.activeHandIndex && !this.round?.completed ? 'active' : '',
      hand.failed ? 'failed' : '',
    ].join(' ');
  }

  handSummary(hand: PlayerHand): string {
    const result = hand.result ? ` | ${hand.result}` : '';
    return `${this.money(hand.wager)} | ${this.handValue(hand.cards).total}${result}`;
  }

  private createHand(cards: Card[], wager: number): PlayerHand {
    return { cards, wager, completed: false, failed: false, doubled: false, result: null };
  }

  private buildShoe(decks: number): Card[] {
    const cards: Card[] = [];
    for (let deck = 0; deck < decks; deck += 1) {
      for (const suit of SUITS) {
        for (const rank of RANKS) cards.push({ rank, suit });
      }
    }
    return this.shuffle(cards);
  }

  private shuffle(cards: Card[]): Card[] {
    const copy = [...cards];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const random = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[random]] = [copy[random], copy[index]];
    }
    return copy;
  }

  private drawCard(): Card {
    if (this.shoe.length < 20) this.shoe = this.buildShoe(this.tableRules.decks);
    const card = this.shoe.pop();
    if (!card) throw new Error('Shoe unexpectedly empty');
    return card;
  }

  private cardValue(card: Card): number {
    if (card.rank === 'A') return 11;
    if (['K', 'Q', 'J'].includes(card.rank)) return 10;
    return Number(card.rank);
  }

  private normalizeDealerRank(card: Card): DealerRank {
    if (this.cardValue(card) === 10) return '10';
    return card.rank as DealerRank;
  }

  private handValue(cards: Card[]): { total: number; soft: boolean } {
    let total = cards.reduce((sum, card) => sum + this.cardValue(card), 0);
    let aces = cards.filter((card) => card.rank === 'A').length;
    const rawTotal = total;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    return {
      total,
      soft: cards.some((card) => card.rank === 'A') && total <= 21 && total + 10 <= rawTotal,
    };
  }

  private isBlackjack(cards: Card[]): boolean {
    return cards.length === 2 && this.handValue(cards).total === 21;
  }

  private isPair(cards: Card[]): boolean {
    return cards.length === 2 && this.cardValue(cards[0]) === this.cardValue(cards[1]);
  }

  private correctAction(hand: PlayerHand, dealerUpcard: Card): Action {
    const dealer = this.normalizeDealerRank(dealerUpcard);
    const cards = hand.cards;
    const value = this.handValue(cards);

    if (this.canSplit(hand)) {
      const pairRank = this.cardValue(cards[0]) === 10 ? '10' : cards[0].rank;
      const pairAction = this.basicStrategy.pairs[pairRank]?.[dealer];
      if (pairAction) return pairAction;
    }

    if (value.soft && cards.length === 2) return this.softTotalAction(value.total, dealer);
    return this.hardTotalAction(value.total, dealer);
  }

  private hardTotalAction(total: number, dealer: DealerRank): Action {
    return this.lookupAction(this.basicStrategy.hard, total >= 17 ? '17+' : String(total), dealer, 'hit');
  }

  private softTotalAction(total: number, dealer: DealerRank): Action {
    return this.lookupAction(this.basicStrategy.soft, total >= 20 ? '20+' : String(total), dealer, 'hit');
  }

  private lookupAction(table: StrategyTable, row: string, dealer: DealerRank, fallback: Action): Action {
    return table[row]?.[dealer] ?? fallback;
  }

  private advanceOrFinish(): void {
    const round = this.round;
    if (!round) return;
    const nextIndex = round.playerHands.findIndex((hand, index) => index > round.activeHandIndex && !hand.completed);
    if (nextIndex >= 0) {
      round.activeHandIndex = nextIndex;
      this.setMessage('Next split hand.', '');
      return;
    }
    this.finishCleanRound();
  }

  private finishCleanRound(): void {
    const round = this.round;
    if (!round) return;
    round.dealerRevealed = true;
    this.playDealerForPlayerWin();
    const dealerTotal = this.handValue(round.dealerHand).total;

    for (const hand of round.playerHands) {
      if (hand.result === 'lost') continue;
      const total = this.handValue(hand.cards).total;
      if (total > 21) hand.result = 'lost';
      else if (dealerTotal > 21) hand.result = 'won';
      else if (total > dealerTotal) hand.result = 'won';
      else if (total < dealerTotal) hand.result = 'lost';
      else hand.result = 'push';

      if (this.isBlackjack(hand.cards) && !this.isBlackjack(round.dealerHand)) hand.result = 'blackjack';
      if (this.isBlackjack(round.dealerHand) && !this.isBlackjack(hand.cards)) hand.result = 'lost';
    }

    this.settleRound('Hand complete.');
  }

  private forceDealerWin(hand: PlayerHand, action: Action, expected: Action): void {
    const round = this.round;
    if (!round) return;
    round.dealerRevealed = true;
    hand.result = 'lost';
    hand.completed = true;
    this.playDealerForForcedWin(hand);
    for (const otherHand of round.playerHands) {
      if (!otherHand.completed) {
        otherHand.completed = true;
        otherHand.result = otherHand === hand ? 'lost' : 'push';
      }
    }
    this.settleRound(`Incorrect ${this.label(action)}. Basic strategy says ${this.label(expected)}.`);
  }

  private playDealerNormally(): void {
    const round = this.round;
    if (!round) return;
    while (this.dealerMustHit(round.dealerHand)) round.dealerHand.push(this.drawCard());
  }

  private playDealerForPlayerWin(): void {
    const round = this.round;
    if (!round) return;
    const winningHands = round.playerHands.filter((hand) => !hand.failed && this.handValue(hand.cards).total <= 21);
    const target = Math.min(...winningHands.map((hand) => this.handValue(hand.cards).total));

    if (round.dealerHand.length > 1) {
      const hidden = this.findCard((card) => this.dealerMustHit([round.dealerHand[0], card]));
      if (hidden) round.dealerHand[1] = hidden;
    }

    let safety = 0;
    while (this.dealerMustHit(round.dealerHand) && safety < 10) {
      round.dealerHand.push(
        this.findCard((card) => {
          const value = this.handValue([...round.dealerHand, card]).total;
          return value > 21 || (value >= 17 && value < target);
        }) ??
          this.findCard((card) => this.dealerMustHit([...round.dealerHand, card])) ??
          this.drawCard(),
      );
      safety += 1;
    }
  }

  private playDealerForForcedWin(hand: PlayerHand): void {
    const round = this.round;
    if (!round) return;
    const target = this.handValue(hand.cards).total;
    let safety = 0;
    while (this.dealerMustHit(round.dealerHand) && safety < 10) {
      round.dealerHand.push(this.findCardForForcedDealerWin(target) ?? this.drawCard());
      safety += 1;
    }
  }

  private findCardForForcedDealerWin(playerTotal: number): Card | null {
    const round = this.round;
    if (!round) return null;
    return this.findCard((candidate) => {
      const nextDealer = [...round.dealerHand, candidate];
      const value = this.handValue(nextDealer).total;
      return value >= 17 && value <= 21 && value > playerTotal;
    });
  }

  private drawCardForPlayer(hand: PlayerHand): Card | null {
    return this.findCard((card) => this.handValue([...hand.cards, card]).total <= 21);
  }

  private findCard(matches: (card: Card) => boolean): Card | null {
    for (let index = 0; index < this.shoe.length; index += 1) {
      const candidate = this.shoe[index];
      if (matches(candidate)) return this.shoe.splice(index, 1)[0];
    }
    return null;
  }

  private dealerMustHit(cards: Card[]): boolean {
    const value = this.handValue(cards);
    if (value.total < 17) return true;
    return value.total === 17 && value.soft && this.tableRules.dealerHitsSoft17;
  }

  private settleRound(message: string): void {
    const round = this.round;
    if (!round) return;
    let delta = 0;
    for (const hand of round.playerHands) {
      if (hand.result === 'won') delta += hand.wager;
      if (hand.result === 'blackjack') delta += hand.wager * this.tableRules.blackjackPayout;
      if (hand.result === 'lost') delta -= hand.wager;
    }
    this.bankroll += delta;
    round.completed = true;
    this.stats.handsPlayed += 1;
    const summary = `${message} ${delta >= 0 ? '+' : ''}${this.money(delta)}`;
    this.history = [summary, ...this.history].slice(0, 8);
    this.setMessage(
      summary,
      round.playerHands.some((item) => item.failed)
        ? 'The dealer resolved legally, but the hand was locked as a loss after the strategy mistake.'
        : '',
    );
  }

  private setMessage(message: string, hint: string): void {
    this.message = message;
    this.hint = hint;
  }

  private label(action: Action): string {
    return {
      hit: 'Hit',
      stand: 'Stand',
      double: 'Double',
      split: 'Split',
    }[action];
  }

  money(value: number): string {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
}
