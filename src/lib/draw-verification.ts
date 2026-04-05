// src/lib/draw-verification.ts
import crypto from 'crypto'

/**
 * WINNER VERIFICATION SYSTEM
 *
 * How it works:
 * 1. Before a draw, we generate a random seed and commit its SHA-256 hash publicly
 * 2. After the draw, we reveal the seed + use it to deterministically generate winning numbers
 * 3. Anyone can verify: hash(seed) === committed hash, and numbers came from seed
 * 4. Each winner gets a cryptographic proof that includes their ticket, draw result, and verification hash
 */

export function generateDrawSeed(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function commitDrawSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex')
}

export function generateWinningNumbers(
  seed: string,
  count: number = 6,
  max: number = 49
): number[] {
  const numbers: Set<number> = new Set()
  let counter = 0
  while (numbers.size < count) {
    const hash = crypto
      .createHash('sha256')
      .update(`${seed}:${counter}`)
      .digest('hex')
    const num = (parseInt(hash.slice(0, 8), 16) % max) + 1
    numbers.add(num)
    counter++
  }
  return Array.from(numbers).sort((a, b) => a - b)
}

export function generateBonusNumber(
  seed: string,
  winningNumbers: number[],
  max: number = 49
): number {
  let counter = 100
  while (true) {
    const hash = crypto
      .createHash('sha256')
      .update(`${seed}:bonus:${counter}`)
      .digest('hex')
    const num = (parseInt(hash.slice(0, 8), 16) % max) + 1
    if (!winningNumbers.includes(num)) return num
    counter++
  }
}

export function verifyDrawIntegrity(
  seed: string,
  committedHash: string,
  winningNumbers: number[],
  bonusNumber: number
): { valid: boolean; reason?: string } {
  // Verify seed matches committed hash
  const computedHash = commitDrawSeed(seed)
  if (computedHash !== committedHash) {
    return { valid: false, reason: 'Seed does not match committed hash — draw may have been tampered' }
  }

  // Verify winning numbers were generated from seed
  const expectedNumbers = generateWinningNumbers(seed)
  const expectedBonus = generateBonusNumber(seed, expectedNumbers)

  if (JSON.stringify(expectedNumbers) !== JSON.stringify(winningNumbers)) {
    return { valid: false, reason: 'Winning numbers do not match seed — draw may have been tampered' }
  }
  if (expectedBonus !== bonusNumber) {
    return { valid: false, reason: 'Bonus number does not match seed' }
  }

  return { valid: true }
}

export interface WinnerProof {
  drawId: string
  drawName: string
  drawDate: string
  drawSeed: string
  committedHash: string
  winningNumbers: number[]
  bonusNumber: number
  ticketId: string
  ticketNumbers: number[]
  userId: string
  prizeTier: string
  prizeAmount: string
  proofHash: string
  verifiedAt: string
}

export function generateWinnerProof(data: Omit<WinnerProof, 'proofHash'>): WinnerProof {
  const proofData = JSON.stringify(data)
  const proofHash = crypto
    .createHmac('sha256', process.env.DRAW_VERIFICATION_SECRET ?? 'verification-secret')
    .update(proofData)
    .digest('hex')
  return { ...data, proofHash }
}

export function verifyWinnerProof(proof: WinnerProof): boolean {
  const { proofHash, ...data } = proof
  const expectedHash = crypto
    .createHmac('sha256', process.env.DRAW_VERIFICATION_SECRET ?? 'verification-secret')
    .update(JSON.stringify(data))
    .digest('hex')
  return expectedHash === proofHash
}

export type PrizeTier = {
  name: string
  matchCount: number
  requiresBonus: boolean
  multiplier: number // fraction of jackpot or fixed
  isFixed: boolean
  fixedAmount?: bigint
}

export const PRIZE_TIERS: PrizeTier[] = [
  { name: 'Jackpot',      matchCount: 6, requiresBonus: false, multiplier: 1.0,   isFixed: false },
  { name: '2nd Prize',    matchCount: 5, requiresBonus: true,  multiplier: 0.05,  isFixed: false },
  { name: '3rd Prize',    matchCount: 5, requiresBonus: false, multiplier: 0.02,  isFixed: false },
  { name: '4th Prize',    matchCount: 4, requiresBonus: false, multiplier: 0,     isFixed: true, fixedAmount: BigInt(10000 * 100) },
  { name: '5th Prize',    matchCount: 3, requiresBonus: false, multiplier: 0,     isFixed: true, fixedAmount: BigInt(100 * 100) },
  { name: '6th Prize',    matchCount: 2, requiresBonus: true,  multiplier: 0,     isFixed: true, fixedAmount: BigInt(10 * 100) },
]

export function checkTicketWin(
  ticketNumbers: number[],
  ticketBonus: number | null,
  winningNumbers: number[],
  winningBonus: number,
  jackpotAmount: bigint
): { tier: PrizeTier | null; amount: bigint } {
  const matches = ticketNumbers.filter(n => winningNumbers.includes(n)).length
  const bonusMatch = ticketBonus === winningBonus

  for (const tier of PRIZE_TIERS) {
    if (tier.matchCount === matches && (!tier.requiresBonus || bonusMatch)) {
      const amount = tier.isFixed
        ? (tier.fixedAmount ?? BigInt(0))
        : BigInt(Math.floor(Number(jackpotAmount) * tier.multiplier))
      return { tier, amount }
    }
  }

  return { tier: null, amount: BigInt(0) }
}
