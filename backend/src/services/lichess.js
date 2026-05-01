// Lichess public API — live games only (players now come from Chess.com)
// Rate limit: 300 req/min

import { Chess } from 'chess.js'

const BASE = 'https://lichess.org/api'

// ── Cache ────────────────────────────────────────────────────────────────────
const cache = new Map()

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { cache.delete(key); return null }
  return entry.data
}

function setCache(key, data, ttlMs) {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}

async function lichessFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', ...opts.headers },
    ...opts,
  })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`Lichess ${res.status}: ${path}`)
  }
  return res.json()
}

// ── FEN from PGN moves ───────────────────────────────────────────────────────
/**
 * Computes current FEN by replaying all moves via chess.js.
 * Returns starting FEN if moves are empty or unparseable.
 */
export function fenFromMoves(movesStr) {
  const chess = new Chess()
  if (!movesStr) return chess.fen()
  for (const move of movesStr.trim().split(/\s+/)) {
    try {
      chess.move(move)
    } catch {
      break
    }
  }
  return chess.fen()
}

// ── Live TV channels ─────────────────────────────────────────────────────────
const MAIN_VARIANTS = ['Classical', 'Rapid', 'Blitz', 'Bullet', 'Best']

export async function getLiveTVChannels() {
  const key = 'tv_channels'
  const cached = getCached(key)
  if (cached) return cached

  const data = await lichessFetch('/tv/channels')
  if (!data) return []

  const games = Object.entries(data)
    .filter(([variant]) => MAIN_VARIANTS.includes(variant))
    .map(([variant, game]) => ({
      id:      game.gameId,
      variant,
      player:  {
        name:   game.user?.name ?? 'Unknown',
        id:     game.user?.id ?? null,
        title:  game.user?.title ?? null,
        rating: game.rating ?? null,
        color:  game.color,
      },
      url: `https://lichess.org/${game.gameId}`,
    }))

  setCache(key, games, 30 * 1000)
  return games
}

// ── Game export ───────────────────────────────────────────────────────────────
export async function getGame(gameId) {
  const data = await lichessFetch(
    `/game/export/${gameId}?moves=true&pgnInJson=true&clocks=false&evals=false&opening=true`,
  )
  if (!data) return null

  return {
    ...data,
    fen: fenFromMoves(data.moves),
  }
}
