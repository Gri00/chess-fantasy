import { supabaseAdmin } from "../services/supabase.js";
import { sendPushNotification } from "../services/notifications.js";
import authenticate from "../middleware/authenticate.js";

export default async function leagueRoutes(app) {
  app.post(
    "/",
    {
      onRequest: [authenticate],
      schema: {
        body: {
          type: "object",
          required: ["name", "team_name"],
          properties: {
            name: { type: "string", minLength: 3, maxLength: 50 },
            description: { type: "string", maxLength: 200 },
            league_type: { type: "string", enum: ["private", "public"] },
            roster_size: { type: "integer", minimum: 3, maximum: 10 },
            max_teams: { type: "integer", minimum: 2, maximum: 50 },
            tier_limits: { type: "object" },
            scoring_rules: { type: "object" },
            picks_deadline: { type: "string" },
            season_start: { type: "string" },
            season_end: { type: "string" },
            team_name: { type: "string", minLength: 2, maxLength: 40 },
          },
        },
      },
    },
    async (request, reply) => {
      const {
        name,
        description,
        league_type = "private",
        roster_size = 5,
        max_teams = 20,
        tier_limits,
        scoring_rules,
        picks_deadline,
        season_start,
        season_end,
        team_name,
      } = request.body;

      const { data: league, error: leagueError } = await supabaseAdmin
        .from("leagues")
        .insert({
          name,
          description,
          commissioner_id: request.user.id,
          league_type,
          roster_size,
          max_teams,
          ...(tier_limits && { tier_limits }),
          ...(scoring_rules && { scoring_rules }),
          ...(picks_deadline && { picks_deadline }),
          ...(season_start && { season_start }),
          ...(season_end && { season_end }),
        })
        .select()
        .single();

      if (leagueError) {
        app.log.error(leagueError);
        return reply.code(500).send({ error: "Greška pri kreiranju lige" });
      }

      const { error: memberError } = await supabaseAdmin
        .from("league_members")
        .insert({ league_id: league.id, user_id: request.user.id, team_name });

      if (memberError) {
        app.log.error(memberError);
        await supabaseAdmin.from("leagues").delete().eq("id", league.id);
        return reply.code(500).send({ error: "Greška pri kreiranju tima" });
      }

      return reply.code(201).send({ league });
    },
  );

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
          },
        },
      },
    },
    async (request, reply) => {
      const { page = 1, limit = 20, search } = request.query;
      const offset = (page - 1) * limit;
      let query = supabaseAdmin
        .from("leagues")
        .select(
          "id, name, description, league_type, status, roster_size, max_teams, season_start, season_end, created_at, invite_code, commissioner:users!commissioner_id(username, avatar_url), member_count:league_members(count)",
          { count: "exact" },
        )
        .eq("league_type", "public")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error, count } = await query;
      if (error) {
        app.log.error(error);
        return reply.code(500).send({ error: "Greška pri dohvatanju liga" });
      }
      return reply.send({
        leagues: data,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      });
    },
  );

  app.get("/mine", { onRequest: [authenticate] }, async (request, reply) => {
    const { data, error } = await supabaseAdmin
      .from("league_members")
      .select(
        "team_name, joined_at, league:leagues(id, name, description, league_type, status, roster_size, invite_code, season_start, season_end, commissioner_id)",
      )
      .eq("user_id", request.user.id)
      .order("joined_at", { ascending: false });
    if (error) {
      app.log.error(error);
      return reply.code(500).send({ error: "Greška pri dohvatanju liga" });
    }
    return reply.send({ leagues: data });
  });

  app.get("/:id", { onRequest: [authenticate] }, async (request, reply) => {
    const { id } = request.params;
    const { data: league, error } = await supabaseAdmin
      .from("leagues")
      .select(
        "*, commissioner:users!commissioner_id(id, username, avatar_url), members:league_members(id, team_name, joined_at, user:users(id, username, avatar_url))",
      )
      .eq("id", id)
      .single();
    if (error || !league)
      return reply.code(404).send({ error: "Liga nije pronađena" });
    if (league.league_type === "private") {
      const isMember = league.members.some(
        (m) => m.user.id === request.user.id,
      );
      if (!isMember && league.commissioner_id !== request.user.id)
        return reply.code(403).send({ error: "Nemaš pristup ovoj ligi" });
    }
    return reply.send({ league });
  });

  app.post(
    "/join",
    {
      onRequest: [authenticate],
      schema: {
        body: {
          type: "object",
          required: ["invite_code", "team_name"],
          properties: {
            invite_code: { type: "string" },
            team_name: { type: "string", minLength: 2, maxLength: 40 },
          },
        },
      },
    },
    async (request, reply) => {
      const { invite_code, team_name } = request.body;

      const { data: league, error: leagueError } = await supabaseAdmin
        .from("leagues")
        .select("id, status, max_teams, commissioner_id")
        .eq("invite_code", invite_code.toUpperCase())
        .single();
      if (leagueError || !league)
        return reply.code(404).send({ error: "Nevažeći invite kod" });
      if (league.status !== "pending")
        return reply
          .code(400)
          .send({ error: "Liga je već počela ili završena" });

      const { count } = await supabaseAdmin
        .from("league_members")
        .select("*", { count: "exact", head: true })
        .eq("league_id", league.id);
      if (count >= league.max_teams)
        return reply.code(400).send({ error: "Liga je popunjena" });

      const { data: existing } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", league.id)
        .eq("user_id", request.user.id)
        .single();
      if (existing)
        return reply.code(409).send({ error: "Već si član ove lige" });

      const { data: member, error: memberError } = await supabaseAdmin
        .from("league_members")
        .insert({ league_id: league.id, user_id: request.user.id, team_name })
        .select()
        .single();
      if (memberError) {
        app.log.error(memberError);
        return reply.code(500).send({ error: "Greška pri pridruživanju" });
      }

      try {
        const { data: commissioner } = await supabaseAdmin
          .from("users")
          .select("push_token, username")
          .eq("id", league.commissioner_id)
          .single();
        if (commissioner?.push_token) {
          await sendPushNotification(
            commissioner.push_token,
            "Nova liga notifikacija! 🏆",
            `${request.user.username} se pridružio tvojoj ligi!`,
            { league_id: league.id },
          );
        }
      } catch (err) {
        app.log.error("[Push] Greška:", err);
      }

      return reply.code(201).send({ member });
    },
  );

  app.post(
    "/:id/join",
    {
      onRequest: [authenticate],
      schema: {
        body: {
          type: "object",
          required: ["team_name"],
          properties: {
            team_name: { type: "string", minLength: 2, maxLength: 40 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { team_name } = request.body;
      const { data: league, error: leagueError } = await supabaseAdmin
        .from("leagues")
        .select("id, status, max_teams, league_type, commissioner_id")
        .eq("id", id)
        .single();
      if (leagueError || !league)
        return reply.code(404).send({ error: "Liga nije pronađena" });
      if (league.league_type !== "public")
        return reply.code(403).send({ error: "Ova liga zahteva invite kod" });
      if (league.status !== "pending")
        return reply
          .code(400)
          .send({ error: "Liga je već počela ili završena" });
      const { count } = await supabaseAdmin
        .from("league_members")
        .select("*", { count: "exact", head: true })
        .eq("league_id", id);
      if (count >= league.max_teams)
        return reply.code(400).send({ error: "Liga je popunjena" });
      const { data: existing } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", id)
        .eq("user_id", request.user.id)
        .single();
      if (existing)
        return reply.code(409).send({ error: "Već si član ove lige" });
      const { data: member, error: memberError } = await supabaseAdmin
        .from("league_members")
        .insert({ league_id: id, user_id: request.user.id, team_name })
        .select()
        .single();
      if (memberError) {
        app.log.error(memberError);
        return reply.code(500).send({ error: "Greška pri pridruživanju" });
      }
      try {
        const { data: commissioner } = await supabaseAdmin
          .from("users")
          .select("push_token")
          .eq("id", league.commissioner_id)
          .single();
        if (commissioner?.push_token)
          await sendPushNotification(
            commissioner.push_token,
            "Nova liga notifikacija! 🏆",
            "Novi igrač se pridružio tvojoj ligi!",
            { league_id: id },
          );
      } catch (err) {
        app.log.error("[Push] Greška:", err);
      }
      return reply.code(201).send({ member });
    },
  );

  app.get(
    "/:id/standings",
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { id } = request.params;
      const { data: membership } = await supabaseAdmin
        .from("league_members")
        .select("id")
        .eq("league_id", id)
        .eq("user_id", request.user.id)
        .single();
      if (!membership)
        return reply.code(403).send({ error: "Nisi član ove lige" });
      const { data, error } = await supabaseAdmin
        .from("league_standings")
        .select("*")
        .eq("league_id", id)
        .order("rank", { ascending: true });
      if (error) {
        app.log.error(error);
        return reply
          .code(500)
          .send({ error: "Greška pri dohvatanju standings" });
      }
      return reply.send({ standings: data });
    },
  );

  app.patch(
    "/:id",
    {
      onRequest: [authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 3, maxLength: 50 },
            description: { type: "string", maxLength: 200 },
            status: {
              type: "string",
              enum: ["pending", "active", "completed"],
            },
            picks_deadline: { type: "string" },
            season_start: { type: "string" },
            season_end: { type: "string" },
            scoring_rules: { type: "object" },
            tier_limits: { type: "object" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { data: league } = await supabaseAdmin
        .from("leagues")
        .select("commissioner_id")
        .eq("id", id)
        .single();
      if (!league || league.commissioner_id !== request.user.id)
        return reply
          .code(403)
          .send({ error: "Samo komisar može da menja ligu" });
      const allowed = [
        "name",
        "description",
        "status",
        "picks_deadline",
        "season_start",
        "season_end",
        "scoring_rules",
        "tier_limits",
      ];
      const updates = {};
      for (const key of allowed) {
        if (request.body[key] !== undefined) updates[key] = request.body[key];
      }
      const { data, error } = await supabaseAdmin
        .from("leagues")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        app.log.error(error);
        return reply.code(500).send({ error: "Greška pri update-u" });
      }
      return reply.send({ league: data });
    },
  );

  app.delete(
    "/:id/leave",
    { onRequest: [authenticate] },
    async (request, reply) => {
      const { id } = request.params;
      const { data: league } = await supabaseAdmin
        .from("leagues")
        .select("commissioner_id")
        .eq("id", id)
        .single();
      if (league?.commissioner_id === request.user.id)
        return reply
          .code(400)
          .send({
            error:
              "Komisar ne može da napusti ligu — prvo prenesi ulogu ili obrisi ligu",
          });
      const { error } = await supabaseAdmin
        .from("league_members")
        .delete()
        .eq("league_id", id)
        .eq("user_id", request.user.id);
      if (error)
        return reply.code(500).send({ error: "Greška pri napuštanju" });
      return reply.send({ message: "Uspešno si napustio ligu" });
    },
  );
}
