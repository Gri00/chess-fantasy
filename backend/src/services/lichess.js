// Lichess public API — live games only (players now come from Chess.com)
// Rate limit: 300 req/min

import { Chess } from "chess.js";

const BASE = "https://lichess.org/api";

//Cache
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttlMs) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

async function lichessFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.text().catch(() => "");
    throw new Error(`Lichess ${res.status}: ${path} — ${body.slice(0, 120)}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // Lichess returned non-JSON (e.g. PGN text) despite Accept: application/json
    console.warn(
      `[lichess] non-JSON response for ${path}:`,
      text.slice(0, 120),
    );
    return null;
  }
}

//FEN from PGN moves
/**
 * Computes current FEN by replaying all moves via chess.js.
 * Returns starting FEN if moves are empty or unparseable.
 */
export function fenFromMoves(movesStr) {
  const chess = new Chess();
  if (!movesStr) return chess.fen();
  for (const move of movesStr.trim().split(/\s+/)) {
    try {
      chess.move(move);
    } catch {
      break;
    }
  }
  return chess.fen();
}

//Live TV channels
// API returns lowercase keys ('blitz', 'rapid', etc.)
const MAIN_VARIANTS = new Set([
  "classical",
  "rapid",
  "blitz",
  "bullet",
  "best",
]);

export async function getLiveTVChannels() {
  const key = "tv_channels";
  const cached = getCached(key);
  if (cached) return cached;

  const data = await lichessFetch("/tv/channels");
  if (!data) return [];

  const games = Object.entries(data)
    .filter(([variant]) => MAIN_VARIANTS.has(variant.toLowerCase()))
    .map(([variant, game]) => ({
      id: game.gameId,
      variant: variant.charAt(0).toUpperCase() + variant.slice(1), // normalise to "Blitz" etc.
      player: {
        name: game.user?.name ?? "Unknown",
        id: game.user?.id ?? null,
        title: game.user?.title ?? null,
        rating: game.rating ?? null,
        color: game.color,
      },
      url: `https://lichess.org/${game.gameId}`,
    }));

  setCache(key, games, 30 * 1000);
  return games;
}

//Broadcast PGN parser

function formatPlayerName(name) {
  if (!name) return "";
  const parts = name.split(", ");
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
}

function parseSinglePGN(pgn) {
  const headers = {};
  const headerRe = /\[(\w+)\s+"([^"]*)"\]/g;
  let m;
  while ((m = headerRe.exec(pgn)) !== null) headers[m[1]] = m[2];

  const lastBracket = pgn.lastIndexOf("]");
  let raw = lastBracket >= 0 ? pgn.slice(lastBracket + 1) : pgn;

  raw = raw
    .replace(/\{[^}]*\}/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\$\d+/g, "")
    .replace(/\d+\.\.\./g, " ")
    .replace(/\d+\./g, " ")
    .trim();

  const resultSet = new Set(["*", "1-0", "0-1", "1/2-1/2"]);
  const tokens = raw.split(/\s+/).filter(Boolean);
  const result =
    tokens.length > 0 && resultSet.has(tokens[tokens.length - 1])
      ? tokens.pop()
      : "*";

  const moves = tokens.join(" ");
  const siteId = (headers.Site ?? "").split("/").pop() || null;

  return {
    id: siteId || headers.Round?.replace(/\./g, "-") || String(Math.random()),
    round: headers.Round ?? null,
    white: {
      name: formatPlayerName(headers.White) || "White",
      rating: headers.WhiteElo ? parseInt(headers.WhiteElo) : null,
      title: headers.WhiteTitle ?? null,
    },
    black: {
      name: formatPlayerName(headers.Black) || "Black",
      rating: headers.BlackElo ? parseInt(headers.BlackElo) : null,
      title: headers.BlackTitle ?? null,
    },
    opening: headers.Opening
      ? { name: headers.Opening, eco: headers.ECO ?? null }
      : null,
    moves,
    result,
    status: result === "*" ? "started" : "finished",
    fen: fenFromMoves(moves),
  };
}

function parseBroadcastPGN(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = normalized.split(/\n(?=\[Event )/);
  const games = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith("[")) continue;
    try {
      games.push(parseSinglePGN(trimmed));
    } catch {
      /* skip */
    }
  }
  return games;
}

//Broadcasts API

export async function getOngoingBroadcasts() {
  const key = "broadcasts_active";
  const cached = getCached(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/broadcast?nb=30`, {
    headers: { Accept: "application/x-ndjson" },
  });
  if (!res.ok) return [];

  const text = await res.text();
  const broadcasts = [];
  for (const line of text.trim().split("\n")) {
    if (!line.trim()) continue;
    try {
      const b = JSON.parse(line);
      const ongoingRound = b.rounds?.find((r) => r.ongoing);
      if (!ongoingRound) continue;
      broadcasts.push({
        id: b.tour.id,
        name: b.tour.name,
        slug: b.tour.slug,
        tier: b.tour.tier ?? 0,
        image: b.tour.image ?? null,
        round: {
          id: ongoingRound.id,
          name: ongoingRound.name,
          url: ongoingRound.url ?? null,
        },
      });
    } catch {
      /* skip */
    }
  }
  broadcasts.sort((a, b) => b.tier - a.tier);
  setCache(key, broadcasts, 60_000);
  return broadcasts;
}

export async function getBroadcastGames(roundId) {
  const key = `bcast_${roundId}`;
  const cached = getCached(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/broadcast/round/${roundId}/games`, {
    headers: { Accept: "application/x-chess-pgn" },
  });
  if (!res.ok) return [];

  const text = await res.text();
  const games = parseBroadcastPGN(text);
  setCache(key, games, 3000);
  return games;
}

//TV channel current game (fallback for broadcast games)
export async function getChannelCurrentGame(channel) {
  const channelLower = channel.toLowerCase();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${BASE}/tv/${channelLower}/feed`, {
      headers: { Accept: "application/x-ndjson" },
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const nl = buffer.indexOf("\n");
        if (nl === -1) continue;
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        const event = JSON.parse(line);
        if (event.t === "featured" && event.d) {
          const d = event.d;
          const white = (d.players ?? []).find((p) => p.color === "white");
          const black = (d.players ?? []).find((p) => p.color === "black");
          return {
            id: d.id,
            variant: channel.charAt(0).toUpperCase() + channel.slice(1),
            status: "started",
            fen: d.fen ?? null,
            moves: "",
            players: {
              white: white
                ? {
                    user: {
                      name: white.user?.name ?? "White",
                      title: white.title,
                    },
                    rating: white.rating,
                  }
                : undefined,
              black: black
                ? {
                    user: {
                      name: black.user?.name ?? "Black",
                      title: black.title,
                    },
                    rating: black.rating,
                  }
                : undefined,
            },
          };
        }
      }
    } finally {
      reader.cancel();
    }
  } catch (err) {
    if (err.name !== "AbortError")
      console.warn("[lichess] channel feed error:", err.message);
  } finally {
    clearTimeout(timer);
  }
  return null;
}

//Game export
export async function getGame(gameId) {
  const key = `game_${gameId}`;
  const cached = getCached(key);
  if (cached) return cached;

  console.log(`[lichess] fetching game ${gameId}`);
  const data = await lichessFetch(
    `/game/export/${gameId}?moves=true&clocks=false&evals=false&opening=true`,
  );

  if (!data) {
    console.warn(`[lichess] game ${gameId} not found`);
    return null;
  }

  console.log(
    `[lichess] game ${gameId} status=${data.status} moves=${data.moves?.split(" ").length ?? 0}`,
  );

  const game = { ...data, fen: fenFromMoves(data.moves) };
  // Cache briefly — still want live move updates to flow through
  const ttl = ["started", "created"].includes(data.status) ? 4000 : 60_000;
  setCache(key, game, ttl);
  return game;
}
