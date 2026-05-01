// Chess.com public API — no auth required
// Docs: https://www.chess.com/news/view/published-data-api

const BASE = 'https://api.chess.com/pub'

const HEADERS = {
  'User-Agent': 'ChessFantasyApp/1.0 (contact@chessfantasy.app)',
  'Accept': 'application/json',
}

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

const TTL = {
  leaderboard: 5 * 60 * 1000,  // 5 min
  player:      5 * 60 * 1000,  // 5 min
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// Tier by rank in our combined leaderboard — more reliable than absolute rating
// (Chess.com ratings differ wildly across formats)
function getTierByRank(rank) {
  if (rank <= 10)  return 'S'
  if (rank <= 30)  return 'A'
  if (rank <= 75)  return 'B'
  if (rank <= 150) return 'C'
  return 'D'
}

// Used only for detail view where we have a single player outside leaderboard context
function getTierByRating(rating) {
  if (!rating) return 'D'
  if (rating >= 3000) return 'S'
  if (rating >= 2900) return 'A'
  if (rating >= 2800) return 'B'
  if (rating >= 2700) return 'C'
  return 'D'
}

function extractCountry(countryUrl) {
  if (!countryUrl) return null
  const parts = countryUrl.toString().split('/')
  return parts[parts.length - 1] ?? null
}

async function chesscomFetch(path) {
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`Chess.com ${res.status}: ${path}`)
  }
  return res.json()
}

function formatLeaderboardPlayer(p, format, rank) {
  const rating = p.score ?? null
  return {
    id:               p.username.toLowerCase(),
    full_name:        p.name || p.username,
    title:            p.title ?? null,
    fide_rating:      rating,
    rating_format:    format,     // 'classical' | 'rapid' | 'blitz'
    rank:             rank,       // rank within our combined list
    country_code:     extractCountry(p.country),
    tier:             getTierByRank(rank),
    is_active:        true,
    online:           false,
    profile_image_url: p.avatar ?? null,
  }
}

function formatPlayerProfile(profile, stats) {
  const classical = stats?.chess_classical?.last?.rating ?? null
  const rapid     = stats?.chess_rapid?.last?.rating     ?? null
  const blitz     = stats?.chess_blitz?.last?.rating     ?? null
  const bullet    = stats?.chess_bullet?.last?.rating    ?? null

  // Use best classical → rapid → blitz for tier; these are Chess.com live ratings
  const primaryRating = classical ?? rapid ?? blitz ?? bullet ?? null

  return {
    id:               profile.username.toLowerCase(),
    full_name:        profile.name || profile.username,
    title:            profile.title ?? null,
    fide_rating:      primaryRating,
    ratings: {
      classical,
      rapid,
      blitz,
      bullet,
    },
    country_code:     extractCountry(profile.country),
    tier:             getTierByRating(primaryRating),
    is_active:        true,
    online:           profile.status === 'online',
    followers:        profile.followers ?? 0,
    is_streamer:      profile.is_streamer ?? false,
    profile_image_url: profile.avatar ?? null,
    url:              profile.url ?? null,
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

/**
 * Top players combined from classical + rapid + blitz leaderboards
 * Deduped and sorted by rating descending
 */
export async function getTopPlayers() {
  const key = 'top_players'
  const cached = getCached(key)
  if (cached) return cached

  const data = await chesscomFetch('/leaderboards')
  if (!data) return []

  const seen = new Set()
  const raw = []

  for (const category of ['live_classical', 'live_rapid', 'live_blitz']) {
    const format = category.replace('live_', '')
    for (const p of data[category] ?? []) {
      const id = p.username.toLowerCase()
      if (!seen.has(id)) {
        seen.add(id)
        raw.push({ p, format })
      }
    }
  }

  // Sort by score descending first, then assign rank-based tiers
  raw.sort((a, b) => (b.p.score ?? 0) - (a.p.score ?? 0))
  const players = raw.map(({ p, format }, i) =>
    formatLeaderboardPlayer(p, format, i + 1)
  )

  setCache(key, players, TTL.leaderboard)
  return players
}

/**
 * Single player by Chess.com username — fetches profile + stats.
 * If the player exists in the cached leaderboard, their rank and tier
 * from the list are used so both screens always show the same value.
 */
export async function getPlayer(username) {
  const key = `player_${username.toLowerCase()}`
  const cached = getCached(key)
  if (cached) return cached

  const [[profile, stats], topList] = await Promise.all([
    Promise.all([
      chesscomFetch(`/player/${username}`),
      chesscomFetch(`/player/${username}/stats`),
    ]),
    getTopPlayers().catch(() => null),
  ])

  if (!profile) return null
  const player = formatPlayerProfile(profile, stats)

  // Sync tier and rank with list view
  const listEntry = topList?.find(p => p.id === username.toLowerCase())
  if (listEntry) {
    player.tier          = listEntry.tier
    player.rank          = listEntry.rank
    player.rating_format = listEntry.rating_format
  }

  setCache(key, player, TTL.player)
  return player
}

/**
 * Search — filters cached leaderboard, falls back to direct username lookup
 */
export async function searchPlayers(term) {
  if (!term || term.length < 2) return []

  const topCached = getCached('top_players')
  if (topCached) {
    const q = term.toLowerCase()
    const results = topCached.filter(
      p => p.full_name.toLowerCase().includes(q) || p.id.includes(q)
    )
    if (results.length > 0) return results
  }

  try {
    const player = await getPlayer(term)
    return player ? [player] : []
  } catch {
    return []
  }
}
