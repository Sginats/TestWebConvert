import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
const mockTransaction = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockUpsert = vi.fn();

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    $transaction: mockTransaction,
    tokenWallet: {
      findUnique: mockFindUnique,
      update: mockUpdate,
      upsert: mockUpsert,
    },
    tokenTransaction: {
      create: mockCreate,
    },
  },
}));

import { debitTokens, creditTokens, getBalance } from '../src/lib/tokens';

describe('debitTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debits tokens when balance is sufficient', async () => {
    mockTransaction.mockImplementation(async (fn) => {
      return fn({
        tokenWallet: {
          findUnique: vi.fn().mockResolvedValue({ balance: 100 }),
          update: vi.fn().mockResolvedValue({ balance: 90 }),
        },
        tokenTransaction: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const result = await debitTokens('user1', 10, 'test debit');
    expect(result.success).toBe(true);
    expect(result.balance).toBe(90);
  });

  it('fails when balance is insufficient', async () => {
    mockTransaction.mockImplementation(async (fn) => {
      return fn({
        tokenWallet: {
          findUnique: vi.fn().mockResolvedValue({ balance: 5 }),
          update: vi.fn(),
        },
        tokenTransaction: { create: vi.fn() },
      });
    });

    const result = await debitTokens('user1', 10, 'test debit');
    expect(result.success).toBe(false);
    expect(result.balance).toBe(5);
  });

  it('fails when wallet does not exist', async () => {
    mockTransaction.mockImplementation(async (fn) => {
      return fn({
        tokenWallet: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
        tokenTransaction: { create: vi.fn() },
      });
    });

    const result = await debitTokens('user1', 10, 'test debit');
    expect(result.success).toBe(false);
    expect(result.balance).toBe(0);
  });
});

describe('creditTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('credits tokens to existing wallet', async () => {
    mockTransaction.mockImplementation(async (fn) => {
      return fn({
        tokenWallet: {
          upsert: vi.fn().mockResolvedValue({ balance: 110 }),
        },
        tokenTransaction: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const newBalance = await creditTokens('user1', 10, 'test credit');
    expect(newBalance).toBe(110);
  });
});
