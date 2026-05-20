import { supabaseAdmin } from "../services/supabase.js";
import authenticate from "../middleware/authenticate.js";
import { getTopPlayers, getPlayer, searchPlayers } from "../services/chesscom.js";

export default async function playerRoutes(app) {

  app.get(
    "/",
    {
      onRequest: [authenticate],
      schema: {
        querystring: {
          type: "object",
          properties: {
            page:  { type: "integer", default: 1 },
            limit: { type: "integer", default: 20, maximum: 50 },
            search: { type: "string" },
            tier:   { type: "string", enum: ["S", "A", "B", "C", "D"] },
          },
        },
      },
    },
    async (request, reply) => {
      const { page = 1, limit = 20, search, tier } = request.query;
      const offset = (page - 1) * limit;

      let players;

      if (search && search.length >= 2) {
        players = await searchPlayers(search);
      } else {
        players = await getTopPlayers();
      }

      if (tier) {
        players = players.filter(p => p.tier === tier);
      }

      if (search && search.length >= 2) {
        const q = search.toLowerCase();
        players = players.filter(
          p =>
            p.full_name.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q),
        );
      }

      const total = players.length;
      const paginated = players.slice(offset, offset + limit);

      return reply.send({
        players: paginated,
        pagination: {
          page:  parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    },
  );

  app.get(
    "/:username",
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { username } = request.params;

      const player = await getPlayer(username);
      if (!player) {
        return reply.code(404).send({ error: "Player not found" });
      }

      return reply.send({ player, recent_performances: [] });
    },
  );

  app.get(
    "/available/:league_id",
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { league_id } = request.params;
      const { tier, search, page = 1, limit = 20 } = request.query;
      const offset = (page - 1) * limit;

      const { data: membership } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", league_id)
        .eq("user_id", request.user.id)
        .single();

      if (!membership) {
        return reply.code(403).send({ error: "You are not a member of this league" });
      }

      const { data: myRoster } = await supabaseAdmin
        .from("rosters")
        .select("chess_player_id")
        .eq("league_member_id", membership.id);

      const draftedUsernames = myRoster ? myRoster.map(d => d.chess_player_id) : [];

      let players = search && search.length >= 2
        ? await searchPlayers(search)
        : await getTopPlayers();

      if (tier)   players = players.filter(p => p.tier === tier);
      if (search) {
        const q = search.toLowerCase();
        players = players.filter(
          p => p.full_name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
        );
      }
      players = players.filter(p => !draftedUsernames.includes(p.id));

      const total = players.length;
      const paginated = players.slice(offset, offset + limit);

      return reply.send({
        players: paginated,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      });
    },
  );

  app.get(
    "/roster/:league_id",
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { league_id } = request.params;
      const { member_id } = request.query;

      let targetMemberId = member_id;

      if (!targetMemberId) {
        const { data: membership } = await supabaseAdmin
          .from("league_members")
          .select("id")
          .eq("league_id", league_id)
          .eq("user_id", request.user.id)
          .single();

        if (!membership) {
          return reply.code(403).send({ error: "You are not a member of this league" });
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

      const enriched = await Promise.all(
        (roster ?? []).map(async entry => {
          if (!entry.chess_player_id) return entry;
          const liveData = await getPlayer(entry.chess_player_id).catch(() => null);
          return liveData ? { ...entry, player: { ...entry.player, ...liveData } } : entry;
        }),
      );

      return reply.send({ roster: enriched });
    },
  );

  app.post(
    "/roster/:league_id",
    {
      onRequest: [authenticate],
      schema: {
        body: {
          type: "object",
          required: ["chess_username"],
          properties: {
            chess_username: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { league_id } = request.params;
      const { chess_username } = request.body;

      const { data: membership } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", league_id)
        .eq("user_id", request.user.id)
        .single();

      if (!membership) {
        return reply.code(403).send({ error: "You are not a member of this league" });
      }

      const { data: league } = await supabaseAdmin
        .from("leagues")
        .select("status, picks_deadline")
        .eq("id", league_id)
        .single();

      if (league.status === "completed") {
        return reply.code(400).send({ error: "Season has ended" });
      }
      if (league.picks_deadline && new Date() > new Date(league.picks_deadline)) {
        return reply.code(400).send({ error: "Pick deadline has expired" });
      }

      const chessPlayer = await getPlayer(chess_username);
      if (!chessPlayer) {
        return reply.code(404).send({ error: "Player not found on Chess.com" });
      }

      const { data: dbPlayer, error: upsertError } = await supabaseAdmin
        .from("chess_players")
        .upsert(
          {
            id:           chessPlayer.id,
            full_name:    chessPlayer.full_name,
            title:        chessPlayer.title,
            fide_rating:  chessPlayer.fide_rating,
            tier:         chessPlayer.tier,
            country_code: chessPlayer.country_code,
            is_active:    true,
          },
          { onConflict: "id" },
        )
        .select()
        .single();

      if (upsertError) {
        app.log.error(upsertError);
        return reply.code(500).send({ error: "Error syncing player data" });
      }

      const { data: roster, error } = await supabaseAdmin
        .from("rosters")
        .insert({
          league_member_id: membership.id,
          chess_player_id:  dbPlayer.id,
          acquired_via:     "free_pick",
        })
        .select()
        .single();

      if (error) {
        app.log.error(error);
        if (error.message?.includes("Roster limit")) {
          return reply.code(400).send({ error: error.message });
        }
        if (error.code === "23505") {
          return reply.code(409).send({ error: "This player is already on your team" });
        }
        return reply.code(500).send({ error: "Error adding player" });
      }

      return reply.code(201).send({ roster: { ...roster, player: dbPlayer } });
    },
  );

  app.delete(
    "/roster/:league_id/:chess_player_id",
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { league_id, chess_player_id } = request.params;

      const { data: membership } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", league_id)
        .eq("user_id", request.user.id)
        .single();

      if (!membership) {
        return reply.code(403).send({ error: "You are not a member of this league" });
      }

      const { data: league } = await supabaseAdmin
        .from("leagues")
        .select("status, picks_deadline")
        .eq("id", league_id)
        .single();

      if (league.status === "completed") {
        return reply.code(400).send({ error: "Season has ended" });
      }
      if (league.picks_deadline && new Date() > new Date(league.picks_deadline)) {
        return reply.code(400).send({ error: "Pick deadline has expired" });
      }

      const { error } = await supabaseAdmin
        .from("rosters")
        .delete()
        .eq("league_member_id", membership.id)
        .eq("chess_player_id", chess_player_id);

      if (error) {
        app.log.error(error);
        return reply.code(500).send({ error: "Error removing player from roster" });
      }

      return reply.send({ message: "Player removed from roster" });
    },
  );
}
