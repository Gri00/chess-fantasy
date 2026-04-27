import { supabaseAdmin } from "../services/supabase.js";
import authenticate from "../middleware/authenticate.js";

export default async function playerRoutes(app) {
  // ─── BROWSE / PRETRAGA IGRAČA ────────────────────────────────
  app.get(
    "/",
    {
      onRequest: [authenticate],
      schema: {
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", default: 1 },
            limit: { type: "integer", default: 20, maximum: 50 },
            search: { type: "string" },
            tier: { type: "string", enum: ["S", "A", "B", "C", "D"] },
            title: { type: "string" },
            country: { type: "string" },
            league_id: { type: "string" }, // ako je prosleđen, označi ko je već drafted
          },
        },
      },
    },
    async (request, reply) => {
      const {
        page = 1,
        limit = 20,
        search,
        tier,
        title,
        country,
        league_id,
      } = request.query;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from("chess_players")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("fide_rating", { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.ilike("full_name", `%${search}%`);
      }

      if (tier) {
        query = query.eq("tier", tier);
      }

      if (title) {
        query = query.eq("title", title);
      }

      if (country) {
        query = query.eq("country_code", country);
      }

      const { data: players, error, count } = await query;

      if (error) {
        app.log.error(error);
        return reply.code(500).send({ error: "Error fetching players" });
      }

      // Ako je prosleđen league_id, označi ko je već drafted
      let draftedIds = new Set();
      if (league_id) {
        const { data: rostered } = await supabaseAdmin
          .from("rosters")
          .select("chess_player_id, league_members!inner(league_id)")
          .eq("league_members.league_id", league_id);

        if (rostered) {
          draftedIds = new Set(rostered.map((r) => r.chess_player_id));
        }
      }

      const playersWithStatus = players.map((p) => ({
        ...p,
        is_drafted: draftedIds.has(p.id),
      }));

      return reply.send({
        players: playersWithStatus,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      });
    },
  );

  // ─── DETALJI IGRAČA ─────────────────────────────────────────
  app.get(
    "/:id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { id } = request.params;

      const { data: player, error } = await supabaseAdmin
        .from("chess_players")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !player) {
        return reply.code(404).send({ error: "Player not found" });
      }

      // Dohvati poslednje performanse
      const { data: performances } = await supabaseAdmin
        .from("player_performances")
        .select(
          `
        *,
        tournament:tournaments(name, time_control, start_date, end_date)
      `,
        )
        .eq("chess_player_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

      return reply.send({
        player,
        recent_performances: performances || [],
      });
    },
  );

  // ─── DOSTUPNI IGRAČI U LIGI (nisu drafted) ──────────────────
  app.get(
    "/available/:league_id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { league_id } = request.params;
      const { tier, search, page = 1, limit = 20 } = request.query;
      const offset = (page - 1) * limit;

      // Provjeri da je user član te lige
      const { data: membership } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", league_id)
        .eq("user_id", request.user.id)
        .single();

      if (!membership) {
        return reply
          .code(403)
          .send({ error: "You are not a member of this league" });
      }

      // Dohvati sve drafted igrače u ovoj ligi
      const { data: drafted } = await supabaseAdmin
        .from("rosters")
        .select("chess_player_id, league_members!inner(league_id)")
        .eq("league_members.league_id", league_id);

      const draftedIds = drafted ? drafted.map((d) => d.chess_player_id) : [];

      let query = supabaseAdmin
        .from("chess_players")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("fide_rating", { ascending: false })
        .range(offset, offset + limit - 1);

      if (draftedIds.length > 0) {
        query = query.not("id", "in", `(${draftedIds.join(",")})`);
      }

      if (tier) query = query.eq("tier", tier);
      if (search) query = query.ilike("full_name", `%${search}%`);

      const { data: players, error, count } = await query;

      if (error) {
        app.log.error(error);
        return reply.code(500).send({ error: "Error fetching players" });
      }

      return reply.send({
        players,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      });
    },
  );

  // ─── ROSTER — DOHVATI TIM ───────────────────────────────────
  app.get(
    "/roster/:league_id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { league_id } = request.params;
      const { member_id } = request.query; // opciono — ako nije prosleđen, vraća tvoj roster

      // Nađi membership
      let targetMemberId = member_id;

      if (!targetMemberId) {
        const { data: membership } = await supabaseAdmin
          .from("league_members")
          .select("id")
          .eq("league_id", league_id)
          .eq("user_id", request.user.id)
          .single();

        if (!membership) {
          return reply
            .code(403)
            .send({ error: "You are not a member of this league" });
        }

        targetMemberId = membership.id;
      }

      const { data: roster, error } = await supabaseAdmin
        .from("roster_details")
        .select("*")
        .eq("league_member_id", targetMemberId)
        .order("is_starter", { ascending: false });

      if (error) {
        app.log.error(error);
        return reply.code(500).send({ error: "Error fetching roster" });
      }

      return reply.send({ roster });
    },
  );

  // ─── ROSTER — DODAJ IGRAČA ──────────────────────────────────
  app.post(
    "/roster/:league_id",
    {
      onRequest: [authenticate],
      schema: {
        body: {
          type: "object",
          required: ["chess_player_id"],
          properties: {
            chess_player_id: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { league_id } = request.params;
      const { chess_player_id } = request.body;

      // Nađi membership
      const { data: membership } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", league_id)
        .eq("user_id", request.user.id)
        .single();

      if (!membership) {
        return reply
          .code(403)
          .send({ error: "You are not a member of this league" });
      }

      // Provjeri da liga još uvek prima pickove
      const { data: league } = await supabaseAdmin
        .from("leagues")
        .select("status, picks_deadline")
        .eq("id", league_id)
        .single();

      if (league.status === "completed") {
        return reply.code(400).send({ error: "Season has ended" });
      }

      if (
        league.picks_deadline &&
        new Date() > new Date(league.picks_deadline)
      ) {
        return reply.code(400).send({ error: "Pick deadline has expired" });
      }

      // Dodaj na roster — trigger check_tier_limit će automatski validirati
      const { data: roster, error } = await supabaseAdmin
        .from("rosters")
        .insert({
          league_member_id: membership.id,
          chess_player_id,
          acquired_via: "free_pick",
        })
        .select(
          `
        *,
        chess_player:chess_players(
          id, full_name, title, fide_rating, tier,
          country_code, profile_image_url
        )
      `,
        )
        .single();

      if (error) {
        app.log.error(error);

        // Trigger greške su čitljive — proslijedi ih direktno
        if (error.message.includes("Roster limit for this tier")) {
          return reply.code(400).send({ error: error.message });
        }
        if (error.message.includes("tier")) {
          return reply.code(400).send({ error: error.message });
        }
        if (error.message.includes("already in a team")) {
          return reply.code(409).send({ error: error.message });
        }
        if (error.code === "23505") {
          return reply
            .code(409)
            .send({ error: "This player is already on your team" });
        }

        return reply.code(500).send({ error: "Error adding player" });
      }

      return reply.code(201).send({ roster });
    },
  );

  // ─── ROSTER — UKLONI IGRAČA ─────────────────────────────────
  app.delete(
    "/roster/:league_id/:chess_player_id",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { league_id, chess_player_id } = request.params;

      const { data: membership } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", league_id)
        .eq("user_id", request.user.id)
        .single();

      if (!membership) {
        return reply
          .code(403)
          .send({ error: "You are not a member of this league" });
      }

      // Provjeri da liga još uvek prima izmjene
      const { data: league } = await supabaseAdmin
        .from("leagues")
        .select("status, picks_deadline")
        .eq("id", league_id)
        .single();

      if (league.status === "completed") {
        return reply.code(400).send({ error: "Season has ended" });
      }

      if (
        league.picks_deadline &&
        new Date() > new Date(league.picks_deadline)
      ) {
        return reply.code(400).send({ error: "Pick deadline has expired" });
      }

      const { error } = await supabaseAdmin
        .from("rosters")
        .delete()
        .eq("league_member_id", membership.id)
        .eq("chess_player_id", chess_player_id);

      if (error) {
        app.log.error(error);
        return reply
          .code(500)
          .send({ error: "Error removing player from roster" });
      }

      return reply.send({ message: "Player removed from roster" });
    },
  );
}
