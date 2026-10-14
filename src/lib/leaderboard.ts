/**
 * Leaderboards saved in this browser's localStorage only. Nothing is sent
 * anywhere, and only 3-letter initials and a score are stored. No faces,
 * photos, or names.
 */

import { formatTime } from './modes'

export type BoardId = 'classic' | 'speed' | 'mystery'

export interface LeaderboardEntry {
  initials: string
  value: number
  at: number
}

export const BOARD_SIZE = 10

/** Points boards rank high-to-low; time boards rank fastest first. */
const ORDER: Record<BoardId, 'desc' | 'asc'> = { classic: 'desc', speed: 'asc', mystery: 'asc' }

const keyFor = (id: BoardId) => `emoji-challenge:leaderboard:${id}:v1`

const isBetter = (id: BoardId, a: number, b: number) => (ORDER[id] === 'desc' ? a > b : a < b)

export function getBoard(id: BoardId): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(keyFor(id))
    const parsed = raw ? (JSON.parse(raw) as LeaderboardEntry[]) : []
    return Array.isArray(parsed) ? parsed.slice(0, BOARD_SIZE) : []
  } catch {
    return []
  }
}

/** The 0-based rank this value would get, or null if it doesn't make the board. */
export function rankFor(id: BoardId, value: number): number | null {
  const board = getBoard(id)
  const index = board.findIndex((e) => isBetter(id, value, e.value))
  if (index !== -1) return index
  return board.length < BOARD_SIZE ? board.length : null
}

/** Saves an entry and returns its 0-based rank. Ties keep the earlier score ahead. */
export function addEntry(id: BoardId, initials: string, value: number): number {
  const board = getBoard(id)
  const entry: LeaderboardEntry = { initials, value, at: Date.now() }
  let index = board.findIndex((e) => isBetter(id, value, e.value))
  if (index === -1) index = board.length
  board.splice(index, 0, entry)
  try {
    localStorage.setItem(keyFor(id), JSON.stringify(board.slice(0, BOARD_SIZE)))
  } catch {
    // Storage can be full or disabled; the game still works without saving.
  }
  return index
}

export function clearBoards() {
  for (const id of Object.keys(ORDER) as BoardId[]) {
    try {
      localStorage.removeItem(keyFor(id))
    } catch {
      // Ignore storage errors.
    }
  }
}

const BLOCKED = new Set([
  'ASS', 'FUK', 'FUC', 'FCK', 'FUX', 'SEX', 'CUM', 'DIK', 'DIC', 'TIT', 'FAG', 'NIG', 'NGR', 'KKK', 'PIS',
  'WTF', 'STD', 'XXX', 'NAZ', 'HOE', 'JIZ', 'KYS', 'SUK', 'SUC', 'POO', 'PEE', 'BUT', 'GAY', 'HOR', 'COK',
  'KOK', 'VAG', 'ANL', 'ANU', 'CLT', 'DMN', 'SHT', 'SHI', 'BCH', 'PUS', 'DAM',
])

export const formatBoardValue = (board: BoardId, value: number) => (board === 'classic' ? `${value} pts` : formatTime(value))

export const isAllowedInitials = (initials: string) => /^[A-Z]{3}$/.test(initials) && !BLOCKED.has(initials)
