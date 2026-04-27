import { supabaseAdmin } from "../services/supabase.js";
import authenticate from "../middleware/authenticate.js";
import {
  processScoringPeriod,
  createScoringPeriods,
  addTestPerformanceAndScore,
} from "../services/scoring.js";

export default async function scoringRoutes(app) {
  // ─── AKTIVIRAJ LIGU + KREIRAJ PERIODE ────────────────────────
  // Samo komisar, liga mora imati season_start i season_end
  app.post(
    "/leagues/:id/activate",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { id } = request.params;

      const { data: league } = await supabaseAdmin
        .from("leagues")
        .select("commissioner_id, status, season_start, season_end")
        .eq("id", id)
        .single();

      if (!league) {
        return reply.code(404).send({ error: "League not found" });
      }

      if (league.commissioner_id !== request.user.id) {
        return reply
          .code(403)
          .send({ error: "Only the commissioner can activate the league" });
      }

      if (league.status !== "pending") {
        return reply
          .code(400)
          .send({ error: "League is already active or completed" });
      }

      if (!league.season_start || !league.season_end) {
        return reply
          .code(400)
          .send({ error: "Set season_start and season_end before activation" });
      }

      // Aktiviraj ligu
      await supabaseAdmin
        .from("leagues")
        .update({ status: "active" })
        .eq("id", id);

      // Kreiraj nedeljne periode
      const periods = await createScoringPeriods(id);

      return reply.send({
        message: "League activated",
        periods_created: periods.length,
        periods,
      });
    },
  );

  // ─── POKRETANJE SCORING PERIODA (ručno ili cron) ─────────────
  app.post(
    "/leagues/:id/score/:period_id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { id, period_id } = request.params;

      const { data: league } = await supabaseAdmin
        .from("leagues")
        .select("commissioner_id")
        .eq("id", id)
        .single();

      if (!league || league.commissioner_id !== request.user.id) {
        return reply
          .code(403)
          .send({ error: "Only the commissioner can initiate scoring" });
      }

      try {
        const result = await processScoringPeriod(period_id);
        return reply.send({ message: "Scoring completed", ...result });
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ error: err.message });
      }
    },
  );

  // ─── DOHVATI SCOROVE ZA PERIOD ────────────────────────────────
  app.get(
    "/leagues/:id/scores",
    {
      onRequest: [authenticate],
      schema: {
        querystring: {
          type: "object",
          properties: {
            period: { type: "integer" }, // period_number, default = poslednji
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { period } = request.query;

      // Provjeri članstvo
      const { data: membership } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", id)
        .eq("user_id", request.user.id)
        .single();

      if (!membership) {
        return reply
          .code(403)
          .send({ error: "You are not a member of this league" });
      }

      // Nađi period
      let periodQuery = supabaseAdmin
        .from("scoring_periods")
        .select("*")
        .eq("league_id", id)
        .order("period_number", { ascending: false });

      if (period) {
        periodQuery = periodQuery.eq("period_number", period);
      }

      const { data: periods } = await periodQuery.limit(1);

      if (!periods || periods.length === 0) {
        return reply.send({ scores: [], period: null });
      }

      const currentPeriod = periods[0];

      // Dohvati scorove za ovaj period
      const { data: scores, error } = await supabaseAdmin
        .from("fantasy_scores")
        .select(
          `
        points_earned, breakdown,
        chess_player:chess_players(full_name, title, tier, fide_rating),
        league_member:league_members(team_name, user:users(username))
      `,
        )
        .eq("scoring_period_id", currentPeriod.id)
        .order("points_earned", { ascending: false });

      if (error) {
        app.log.error(error);
        return reply.code(500).send({ error: "Error fetching scores" });
      }

      return reply.send({
        period: currentPeriod,
        scores,
      });
    },
  );

  // ─── LISTA SVIH PERIODA ───────────────────────────────────────
  app.get(
    "/leagues/:id/periods",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { id } = request.params;

      const { data: membership } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", id)
        .eq("user_id", request.user.id)
        .single();

      if (!membership) {
        return reply
          .code(403)
          .send({ error: "You are not a member of this league" });
      }

      const { data: periods, error } = await supabaseAdmin
        .from("scoring_periods")
        .select("*")
        .eq("league_id", id)
        .order("period_number", { ascending: true });

      if (error) {
        return reply.code(500).send({ error: "Error fetching periods" });
      }

      return reply.send({ periods });
    },
  );

  // ─── TEST ENDPOINT ────────────────────────────────────────────
  // Dodaje fake performansu i odmah računa score — samo za development
  app.post(
    "/leagues/:id/test-score",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { id } = request.params;
      const { chess_player_id } = request.body;

      if (process.env.NODE_ENV === "production") {
        return reply.code(404).send({ error: "Not found" });
      }

      try {
        const result = await addTestPerformanceAndScore(id, chess_player_id);
        return reply.send({ message: "Test performance added", ...result });
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ error: err.message });
      }
    },
  );
}
