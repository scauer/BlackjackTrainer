import type { BasicStrategy } from '../rule-types';

export const defaultBasicStrategy = {
  id: 'default-basic',
  name: 'Default Basic Strategy',
  hard: {
    '17+': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
    '16': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '15': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '14': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '13': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '12': { '2': 'hit', '3': 'hit', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '11': { '2': 'double', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'double', '8': 'double', '9': 'double', '10': 'double', A: 'hit' },
    '10': { '2': 'double', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'double', '8': 'double', '9': 'double', '10': 'hit', A: 'hit' },
    '9': { '2': 'hit', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  },
  soft: {
    '20+': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
    '19': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'double', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
    '18': { '2': 'stand', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'stand', '8': 'stand', '9': 'hit', '10': 'hit', A: 'hit' },
    '17': { '2': 'hit', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '16': { '2': 'hit', '3': 'hit', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '15': { '2': 'hit', '3': 'hit', '4': 'double', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '14': { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '13': { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'double', '6': 'double', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  },
  pairs: {
    A: { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'split', '9': 'split', '10': 'split', A: 'split' },
    '10': { '2': 'stand', '3': 'stand', '4': 'stand', '5': 'stand', '6': 'stand', '7': 'stand', '8': 'stand', '9': 'stand', '10': 'stand', A: 'stand' },
    '9': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'stand', '8': 'split', '9': 'split', '10': 'stand', A: 'stand' },
    '8': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'split', '9': 'split', '10': 'split', A: 'split' },
    '7': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '6': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '5': { '2': 'double', '3': 'double', '4': 'double', '5': 'double', '6': 'double', '7': 'double', '8': 'double', '9': 'double', '10': 'hit', A: 'hit' },
    '4': { '2': 'hit', '3': 'hit', '4': 'hit', '5': 'split', '6': 'split', '7': 'hit', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '3': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
    '2': { '2': 'split', '3': 'split', '4': 'split', '5': 'split', '6': 'split', '7': 'split', '8': 'hit', '9': 'hit', '10': 'hit', A: 'hit' },
  },
} satisfies BasicStrategy;
