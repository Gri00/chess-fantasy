import { Chess } from "chess.js";

const BASE = "https://lichess.org/api";

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
    return null;
  }
}

export function fenFromMoves(movesStr) {
  const chess = new Chess();
  if (!movesStr) return chess.fen();
  for (const move of movesStr.trim().split(/\s+/)) {
    if (!move) continue;
    try {
      chess.move(move);
    } catch {
    }
  }
  return chess.fen();
}

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
      variant: variant.charAt(0).toUpperCase() + variant.slice(1),
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

function evalToWinChance(evalStr) {
  if (!evalStr) return null;
  let cp;
  if (evalStr.startsWith("#")) {
    const n = parseInt(evalStr.slice(1), 10);
    cp = n > 0 ? 10000 : -10000;
  } else {
    cp = Math.round(parseFloat(evalStr) * 100);
  }
  if (isNaN(cp)) return null;
  const white = Math.round(50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1));
  const clamped = Math.max(0, Math.min(100, white));
  return { white: clamped, black: 100 - clamped };
}

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

  const evalRe = /\[%eval\s+(#-?\d+|-?\d+(?:\.\d+)?)\]/g;
  let evalM, lastEvalStr = null;
  while ((evalM = evalRe.exec(pgn)) !== null) lastEvalStr = evalM[1];

  const allClks = [];
  const clkRe2 = /\[%clk\s+(\d+:\d+:\d+)\]/g;
  let clkM2;
  while ((clkM2 = clkRe2.exec(pgn)) !== null) allClks.push(clkM2[1]);
  const whiteClks = allClks.filter((_, i) => i % 2 === 0);
  const blackClks = allClks.filter((_, i) => i % 2 === 1);
  const clock = (whiteClks.length > 0 || blackClks.length > 0) ? {
    white: whiteClks[whiteClks.length - 1] ?? null,
    black: blackClks[blackClks.length - 1] ?? null,
  } : null;

  let timeControl = headers.TimeControl ?? null;
  if (!timeControl) {
    const firstClk = /\[%clk\s+(\d+):(\d+):(\d+)\]/.exec(pgn);
    if (firstClk) {
      const secs = parseInt(firstClk[1], 10) * 3600
                 + parseInt(firstClk[2], 10) * 60
                 + parseInt(firstClk[3], 10);
      timeControl = secs >= 1800 ? "7200+0" : "600+0";
    }
  }

  let raw = pgn.replace(/\[\w+\s+"[^"]*"\]\s*/g, "").trim();

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
    winChance: evalToWinChance(lastEvalStr),
    timeControl,
    clock,
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
    }
  }
  return games;
}

const roundUrlCache = new Map();

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
      if (ongoingRound.url) roundUrlCache.set(ongoingRound.id, ongoingRound.url);
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
          startsAt: ongoingRound.startsAt ?? null,
        },
      });
    } catch {
    }
  }
  broadcasts.sort((a, b) => b.tier - a.tier);
  setCache(key, broadcasts, 60_000);
  return broadcasts;
}

async function fetchBroadcastPGNText(roundId) {
  const apiRes = await fetch(`${BASE}/broadcast/round/${roundId}/games`, {
    headers: { Accept: "application/x-chess-pgn" },
  });
  if (apiRes.ok) {
    const text = await apiRes.text();
    if (text.trim().startsWith("[")) return text;
  }

  const roundUrl = roundUrlCache.get(roundId);
  if (roundUrl) {
    const webUrl = roundUrl.endsWith(".pgn") ? roundUrl : `${roundUrl}.pgn`;
    const webRes = await fetch(webUrl, {
      headers: { Accept: "application/x-chess-pgn, text/plain" },
    });
    if (webRes.ok) {
      const text = await webRes.text();
      if (text.trim().startsWith("[")) return text;
    }
  }

  return null;
}

export async function getBroadcastGames(roundId) {
  const key = `bcast_${roundId}`;
  const cached = getCached(key);
  if (cached) return cached;

  const text = await fetchBroadcastPGNText(roundId);
  if (!text) return [];

  const games = parseBroadcastPGN(text);
  setCache(key, games, 3000);
  return games;
}

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
      console.error("[lichess] channel feed error:", err.message);
  } finally {
    clearTimeout(timer);
  }
  return null;
}

export async function getGame(gameId) {
  const key = `game_${gameId}`;
  const cached = getCached(key);
  if (cached) return cached;

  const data = await lichessFetch(
    `/game/export/${gameId}?moves=true&clocks=false&evals=false&opening=true`,
  );

  if (!data) return null;

  const game = { ...data, fen: fenFromMoves(data.moves) };
  const ttl = ["started", "created"].includes(data.status) ? 4000 : 60_000;
  setCache(key, game, ttl);
  return game;
}
