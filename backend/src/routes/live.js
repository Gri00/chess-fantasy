import authenticate from "../middleware/authenticate.js";
import {
  getLiveTVChannels,
  getGame,
  getChannelCurrentGame,
  fenFromMoves,
} from "../services/lichess.js";

// Shown when Lichess TV returns nothing (rare but can happen during maintenance)
const MOCK_MOVES =
  "e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8 Nc3 Be6 b3 h6 Bb2 Kc8 Rad1 Be7 Nd4 Nxd4 Rxd4 Bd5 f3 a5 Rfd1";

const MOCK_GAME = {
  id: "mock_demo",
  variant: "Classical",
  status: "started",
  players: {
    white: { user: { name: "Magnus Carlsen", title: "GM" }, rating: 2862 },
    black: { user: { name: "Ian Nepomniachtchi", title: "GM" }, rating: 2793 },
  },
  opening: { name: "Ruy López: Berlin Defense", eco: "C65" },
  moves: MOCK_MOVES,
  fen: null, // filled at startup below
};

MOCK_GAME.fen = fenFromMoves(MOCK_MOVES);

const MOCK_LIST = [
  {
    id: "mock_demo",
    variant: "Classical",
    player: {
      name: "Magnus Carlsen",
      id: "drnykterstein",
      title: "GM",
      rating: 2862,
      color: "white",
    },
    url: "https://lichess.org",
  },
];

export default async function liveRoutes(app) {
  //LIVE TV CHANNELS
  app.get("/games", { onRequest: [authenticate] }, async (_request, reply) => {
    try {
      const games = await getLiveTVChannels();
      if (games && games.length > 0) {
        return reply.send({ games, live: true });
      }
    } catch (err) {
      app.log.warn("Lichess TV unavailable:", err.message);
    }
    return reply.send({ games: MOCK_LIST, live: false });
  });

  //GAME DETAIL
  app.get(
    "/games/:id",
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { id } = request.params;
      const { channel } = request.query; // variant name e.g. "Best", "Blitz"

      if (id === "mock_demo") {
        return reply.send({ game: MOCK_GAME, live: false });
      }

      try {
        const game = await getGame(id);
        if (game) return reply.send({ game, live: true });
      } catch (err) {
        app.log.warn("Game fetch failed:", err.message);
      }

      // Broadcast/tournament games can't be exported — fall back to channel feed
      if (channel) {
        try {
          app.log.info(`Falling back to channel feed for: ${channel}`);
          const game = await getChannelCurrentGame(channel);
          if (game) return reply.send({ game, live: true });
        } catch (err) {
          app.log.warn("Channel fallback failed:", err.message);
        }
      }

      return reply.code(404).send({ error: "Game not found" });
    },
  );
}
