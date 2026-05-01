import authenticate from "../middleware/authenticate.js";
import {
  getOngoingBroadcasts,
  getBroadcastGames,
} from "../services/lichess.js";

export default async function broadcastRoutes(app) {
  //Active broadcasts list
  app.get("/", { onRequest: [authenticate] }, async (_request, reply) => {
    try {
      const broadcasts = await getOngoingBroadcasts();
      return reply.send({ broadcasts });
    } catch (err) {
      app.log.warn("Broadcasts fetch failed:", err.message);
      return reply.send({ broadcasts: [] });
    }
  });

  //Games for a broadcast round
  app.get(
    "/:roundId/games",
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { roundId } = request.params;
      try {
        const games = await getBroadcastGames(roundId);
        return reply.send({ games });
      } catch (err) {
        app.log.warn("Broadcast games fetch failed:", err.message);
        return reply.code(500).send({ error: "Failed to load games" });
      }
    },
  );
}
