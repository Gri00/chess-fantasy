import { supabaseAdmin } from "../services/supabase.js";
import authenticate from "../middleware/authenticate.js";

export default async function authRoutes(app) {
  // ─── REGISTER
  app.post(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password", "username"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            username: { type: "string", minLength: 3, maxLength: 30 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password, username } = request.body;

      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (existing) {
        return reply.code(409).send({ error: "Username is already taken" });
      }

      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username },
        });

      if (authError) {
        if (authError.message.includes("already registered")) {
          return reply.code(409).send({ error: "Email already registered" });
        }
        app.log.error(authError);
        return reply.code(500).send({ error: "Error during registration" });
      }

      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      const token = app.jwt.sign(
        { id: authData.user.id, username },
        { expiresIn: "7d" },
      );

      return reply.code(201).send({
        token,
        user: {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        },
      });
    },
  );

  app.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const { data: authData, error: authError } =
        await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        return reply.code(401).send({ error: "Invalid email or password" });
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        return reply.code(404).send({ error: "Profile not found" });
      }

      const token = app.jwt.sign(
        { id: profile.id, username: profile.username },
        { expiresIn: "7d" },
      );

      return reply.send({
        token,
        user: {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        },
      });
    },
  );

  app.get(
    "/me",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      const { data: profile, error } = await supabaseAdmin
        .from("users")
        .select(
          "id, username, display_name, avatar_url, country_code, created_at",
        )
        .eq("id", request.user.id)
        .single();

      if (error || !profile) {
        return reply.code(404).send({ error: "User not found" });
      }

      return reply.send({ user: profile });
    },
  );

  app.patch(
    "/me",
    {
      onRequest: [authenticate],
      schema: {
        body: {
          type: "object",
          properties: {
            display_name: { type: "string", maxLength: 50 },
            avatar_url: { type: "string" },
            country_code: { type: "string", minLength: 2, maxLength: 2 },
            push_token: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const allowed = [
        "display_name",
        "avatar_url",
        "country_code",
        "push_token",
      ];
      const updates = {};
      for (const key of allowed) {
        if (request.body[key] !== undefined) updates[key] = request.body[key];
      }

      if (Object.keys(updates).length === 0) {
        return reply.code(400).send({ error: "No data to update" });
      }

      const { data, error } = await supabaseAdmin
        .from("users")
        .update(updates)
        .eq("id", request.user.id)
        .select("id, username, display_name, avatar_url, country_code")
        .single();

      if (error) {
        return reply.code(500).send({ error: "Error during profile update" });
      }

      return reply.send({ user: data });
    },
  );
}
