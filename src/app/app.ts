import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
type Action = 'hit' | 'stand' | 'double' | 'split';
type Result = 'won' | 'lost' | 'push' | 'blackjack' | null;

interface Card {
  rank: Rank;
  suit: Suit;
}

interface Strategy {
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
const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly startingBankroll = STARTING_BANKROLL;
  readonly baseWager = BASE_WAGER;
  readonly strategies: Strategy[] = [
    {
      id: 'six-deck-h17-das',
      name: '6 Deck H17 DAS',
      decks: 6,
      dealerHitsSoft17: true,
      doubleAfterSplit: true,
      surrenderAllowed: false,
      blackjackPayout: 1.5,
      maxSplitHands: 4,
      doubleAllowedOn: 'any',
    },
    {
      id: 'single-deck-s17',
      name: 'Single Deck S17',
      decks: 1,
      dealerHitsSoft17: false,
      doubleAfterSplit: true,
      surrenderAllowed: false,
      blackjackPayout: 1.5,
      maxSplitHands: 4,
      doubleAllowedOn: 'any',
    },
  ];

  selectedStrategyId = this.strategies[0].id;
  viewMode: 'game' | 'deck' = 'game';
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
      ['Decks', String(this.strategy.decks)],
      ['Dealer soft 17', this.strategy.dealerHitsSoft17 ? 'Hits' : 'Stands'],
      ['Double after split', this.strategy.doubleAfterSplit ? 'Yes' : 'No'],
      ['Blackjack pays', this.strategy.blackjackPayout === 1.5 ? '3:2' : '6:5'],
      ['Base wager', this.money(BASE_WAGER)],
      ['Shoe mode', 'Fresh each hand'],
    ];
  }

  get testDeck(): Card[] {
    return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
  }

  toggleDeckTest(): void {
    this.viewMode = this.viewMode === 'game' ? 'deck' : 'game';
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

    this.shoe = this.buildShoe(this.strategy.decks);
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
      hand.failed = true;
      hand.completed = true;
      this.forceDealerWin(hand, action, expected);
      return;
    }

    this.stats.correctMoves += 1;
    this.stats.streak += 1;

    if (action === 'hit') {
      hand.cards.push(this.drawCard());
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
      hand.cards.push(this.drawCard());
      hand.completed = true;
      this.setMessage('Correct double. One card dealt.', '');
      this.advanceOrFinish();
      return;
    }

    if (action === 'split') {
      const [first, second] = hand.cards;
      hand.cards = [first, this.drawCard()];
      hand.completed = false;
      round.playerHands.splice(round.activeHandIndex + 1, 0, this.createHand([second, this.drawCard()], hand.wager));
      this.setMessage('Correct split. Play the highlighted hand.', '');
    }
  }

  canSplit(hand: PlayerHand | null): boolean {
    return Boolean(
      this.round &&
        hand &&
        hand.cards.length === 2 &&
        this.isPair(hand.cards) &&
        this.round.playerHands.length < this.strategy.maxSplitHands,
    );
  }

  canDouble(hand: PlayerHand | null): boolean {
    return Boolean(hand && hand.cards.length === 2 && !hand.completed);
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
    return `/assets/svg-cards/${hidden ? 'back-blue' : this.cardAssetName(card)}.png`;
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
    if (this.shoe.length < 20) this.shoe = this.buildShoe(this.strategy.decks);
    const card = this.shoe.pop();
    if (!card) throw new Error('Shoe unexpectedly empty');
    return card;
  }

  private cardValue(card: Card): number {
    if (card.rank === 'A') return 11;
    if (['K', 'Q', 'J'].includes(card.rank)) return 10;
    return Number(card.rank);
  }

  private normalizeDealerRank(card: Card): string {
    return this.cardValue(card) === 10 ? '10' : card.rank;
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
      const splitMap: Record<string, Record<string, Action>> = {
        A: this.always('split'),
        '10': this.always('stand'),
        '9': this.byDealer(['7', '10', 'A'], 'stand', 'split'),
        '8': this.always('split'),
        '7': this.byDealer(['2', '3', '4', '5', '6', '7'], 'split', 'hit'),
        '6': this.byDealer(['2', '3', '4', '5', '6'], 'split', 'hit'),
        '5': this.byDealer(['2', '3', '4', '5', '6', '7', '8', '9'], 'double', 'hit'),
        '4': this.byDealer(['5', '6'], 'split', 'hit'),
        '3': this.byDealer(['2', '3', '4', '5', '6', '7'], 'split', 'hit'),
        '2': this.byDealer(['2', '3', '4', '5', '6', '7'], 'split', 'hit'),
      };
      const pairAction = splitMap[pairRank]?.[dealer];
      if (pairAction) return pairAction;
    }

    if (value.soft && cards.length === 2) return this.softTotalAction(value.total, dealer);
    return this.hardTotalAction(value.total, dealer);
  }

  private always(action: Action): Record<string, Action> {
    return Object.fromEntries(DEALER_UPCARDS.map((rank) => [rank, action]));
  }

  private byDealer(ranks: string[], matching: Action, fallback: Action): Record<string, Action> {
    return Object.fromEntries(DEALER_UPCARDS.map((rank) => [rank, ranks.includes(rank) ? matching : fallback]));
  }

  private hardTotalAction(total: number, dealer: string): Action {
    if (total >= 17) return 'stand';
    if (total >= 13) return ['2', '3', '4', '5', '6'].includes(dealer) ? 'stand' : 'hit';
    if (total === 12) return ['4', '5', '6'].includes(dealer) ? 'stand' : 'hit';
    if (total === 11) return dealer === 'A' ? 'hit' : 'double';
    if (total === 10) return ['2', '3', '4', '5', '6', '7', '8', '9'].includes(dealer) ? 'double' : 'hit';
    if (total === 9) return ['3', '4', '5', '6'].includes(dealer) ? 'double' : 'hit';
    return 'hit';
  }

  private softTotalAction(total: number, dealer: string): Action {
    if (total >= 20) return 'stand';
    if (total === 19) return dealer === '6' ? 'double' : 'stand';
    if (total === 18) {
      if (['3', '4', '5', '6'].includes(dealer)) return 'double';
      if (['2', '7', '8'].includes(dealer)) return 'stand';
      return 'hit';
    }
    if (total === 17) return ['3', '4', '5', '6'].includes(dealer) ? 'double' : 'hit';
    if ([15, 16].includes(total)) return ['4', '5', '6'].includes(dealer) ? 'double' : 'hit';
    if ([13, 14].includes(total)) return ['5', '6'].includes(dealer) ? 'double' : 'hit';
    return 'hit';
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
    this.playDealerNormally();
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
    if (!this.round) return null;
    for (let index = 0; index < this.shoe.length; index += 1) {
      const candidate = this.shoe[index];
      const nextDealer = [...this.round.dealerHand, candidate];
      const value = this.handValue(nextDealer).total;
      if (value >= 17 && value <= 21 && value > playerTotal) {
        this.shoe.splice(index, 1);
        return candidate;
      }
    }
    return null;
  }

  private dealerMustHit(cards: Card[]): boolean {
    const value = this.handValue(cards);
    if (value.total < 17) return true;
    return value.total === 17 && value.soft && this.strategy.dealerHitsSoft17;
  }

  private settleRound(message: string): void {
    const round = this.round;
    if (!round) return;
    let delta = 0;
    for (const hand of round.playerHands) {
      if (hand.result === 'won') delta += hand.wager;
      if (hand.result === 'blackjack') delta += hand.wager * this.strategy.blackjackPayout;
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
