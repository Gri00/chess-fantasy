import { supabaseAdmin } from "../services/supabase.js";

// ─── DEFAULT SCORING PRAVILA ────────────────────────────────────
// Ova vrednosti su fallback ako liga nema custom pravila
const DEFAULT_RULES = {
  win_vs_higher: 6,
  win_vs_lower: 3,
  draw_vs_higher: 2,
  draw_vs_lower: 0.5,
  loss: -1,
  rating_gain_per_point: 0.1,
  tournament_win_bonus: 15,
  top3_bonus: 8,
  upset_bonus: 4,
  classical_multiplier: 1.5,
  rapid_multiplier: 1.0,
  blitz_multiplier: 0.75,
  bullet_multiplier: 0.5,
};

// ─── IZRAČUNAJ POENE ZA JEDNOG IGRAČA NA JEDNOM TURNIRU ─────────
export function calculatePlayerScore(
  performance,
  tournament,
  rules = DEFAULT_RULES,
) {
  const r = { ...DEFAULT_RULES, ...rules };
  let points = 0;
  const breakdown = {};

  // Multiplier na osnovu time controla
  const multiplierKey = `${tournament.time_control}_multiplier`;
  const timeMultiplier = r[multiplierKey] ?? 1.0;
  const tournamentWeight = tournament.weight_multiplier ?? 1.0;

  // Poeni za wins
  // Napomena: u player_performances nemamo detalje po partiji
  // (ko je bio higher/lower rated po partiji)
  // Za MVP koristimo aproksimaciju: prosečan win = mix higher/lower
  // Kad dodamo partiju-po-partiju sync, ovo postaje tačnije
  const winPoints = performance.wins * r.win_vs_lower;
  breakdown.wins = winPoints;
  points += winPoints;

  // Poeni za draws
  const drawPoints = performance.draws * r.draw_vs_lower;
  breakdown.draws = drawPoints;
  points += drawPoints;

  // Negativni poeni za losses
  const lossPoints = performance.losses * r.loss;
  breakdown.losses = lossPoints;
  points += lossPoints;

  // Poeni za upset pobede
  if (performance.upsets_scored > 0) {
    const upsetPoints = performance.upsets_scored * r.upset_bonus;
    breakdown.upsets = upsetPoints;
    points += upsetPoints;
  }

  // Poeni za rating gain
  if (performance.rating_change > 0) {
    const ratingPoints = performance.rating_change * r.rating_gain_per_point;
    breakdown.rating_gain = parseFloat(ratingPoints.toFixed(2));
    points += ratingPoints;
  }

  // Bonus za turnirski plasman
  if (performance.final_rank === 1) {
    breakdown.tournament_win_bonus = r.tournament_win_bonus;
    points += r.tournament_win_bonus;
  } else if (performance.final_rank <= 3) {
    breakdown.top3_bonus = r.top3_bonus;
    points += r.top3_bonus;
  }

  // Primjeni time control multiplier
  points = points * timeMultiplier;
  breakdown.time_multiplier = timeMultiplier;

  // Primjeni tournament weight (Candidates = 2.0, casual = 0.5)
  points = points * tournamentWeight;
  breakdown.tournament_weight = tournamentWeight;

  return {
    points: parseFloat(points.toFixed(2)),
    breakdown,
  };
}

// ─── IZRAČUNAJ POENE ZA CEO SCORING PERIOD ──────────────────────
export async function processScoringPeriod(periodId) {
  console.log(`[Scoring] Processing period ${periodId}...`);

  // Dohvati period i ligu
  const { data: period, error: periodError } = await supabaseAdmin
    .from("scoring_periods")
    .select("*, league:leagues(id, scoring_rules, roster_size)")
    .eq("id", periodId)
    .single();

  if (periodError || !period) {
    throw new Error(`Period ${periodId} not found`);
  }

  if (period.is_finalized) {
    console.log(
      `[Scoring] Period ${periodId} is already finalized. Skipping processing.`,
    );
    return;
  }

  const rules = period.league.scoring_rules;

  // Dohvati sve članove lige
  const { data: members } = await supabaseAdmin
    .from("league_members")
    .select("id, user_id, team_name")
    .eq("league_id", period.league.id);

  if (!members || members.length === 0) {
    console.log(`[Scoring] No members in league ${period.league.id}`);
    return;
  }

  // Dohvati sve turnire u ovom periodu
  const { data: tournaments } = await supabaseAdmin
    .from("tournaments")
    .select("*")
    .gte("start_date", period.start_date)
    .lte("end_date", period.end_date)
    .eq("is_finished", true);

  if (!tournaments || tournaments.length === 0) {
    console.log(`[Scoring] No finished tournaments in period ${periodId}`);
    return;
  }

  const tournamentIds = tournaments.map((t) => t.id);
  const tournamentMap = Object.fromEntries(tournaments.map((t) => [t.id, t]));

  // Obradi svakog člana
  const scoreInserts = [];

  for (const member of members) {
    // Dohvati roster ovog člana
    const { data: roster } = await supabaseAdmin
      .from("rosters")
      .select("chess_player_id")
      .eq("league_member_id", member.id);

    if (!roster || roster.length === 0) continue;

    const playerIds = roster.map((r) => r.chess_player_id);

    // Dohvati performanse za sve igrače u ovom periodu
    const { data: performances } = await supabaseAdmin
      .from("player_performances")
      .select("*")
      .in("chess_player_id", playerIds)
      .in("tournament_id", tournamentIds);

    if (!performances || performances.length === 0) continue;

    // Izračunaj poene po igraču
    for (const perf of performances) {
      const tournament = tournamentMap[perf.tournament_id];
      const { points, breakdown } = calculatePlayerScore(
        perf,
        tournament,
        rules,
      );

      scoreInserts.push({
        league_member_id: member.id,
        scoring_period_id: periodId,
        chess_player_id: perf.chess_player_id,
        points_earned: points,
        breakdown,
      });
    }
  }

  if (scoreInserts.length === 0) {
    console.log(`[Scoring] No scores to insert for period ${periodId}`);
  } else {
    // Upiši sve scorove odjednom
    const { error: insertError } = await supabaseAdmin
      .from("fantasy_scores")
      .upsert(scoreInserts, {
        onConflict: "league_member_id,scoring_period_id,chess_player_id",
      });

    if (insertError) {
      throw new Error(`Error inserting scores: ${insertError.message}`);
    }

    console.log(
      `[Scoring] Upisano ${scoreInserts.length} scorova za period ${periodId}`,
    );
  }

  // Finalizuj period
  await supabaseAdmin
    .from("scoring_periods")
    .update({ is_finalized: true, finalized_at: new Date().toISOString() })
    .eq("id", periodId);

  console.log(`[Scoring] Period ${periodId} finalized.`);
  return { processed: scoreInserts.length };
}

// ─── KREIRAJ SCORING PERIODE ZA LIGU ────────────────────────────
// Poziva se kad komisar aktivira ligu
export async function createScoringPeriods(leagueId) {
  const { data: league } = await supabaseAdmin
    .from("leagues")
    .select("season_start, season_end")
    .eq("id", leagueId)
    .single();

  if (!league.season_start || !league.season_end) {
    throw new Error(
      "League must have season_start and season_end to create scoring periods",
    );
  }

  const start = new Date(league.season_start);
  const end = new Date(league.season_end);
  const periods = [];
  let current = new Date(start);
  let periodNumber = 1;

  // Nedeljni periodi
  while (current < end) {
    const periodEnd = new Date(current);
    periodEnd.setDate(periodEnd.getDate() + 6);
    if (periodEnd > end) periodEnd.setTime(end.getTime());

    periods.push({
      league_id: leagueId,
      period_number: periodNumber,
      start_date: current.toISOString().split("T")[0],
      end_date: periodEnd.toISOString().split("T")[0],
    });

    current.setDate(current.getDate() + 7);
    periodNumber++;
  }

  const { data, error } = await supabaseAdmin
    .from("scoring_periods")
    .insert(periods)
    .select();

  if (error) throw new Error(`Error creating periods: ${error.message}`);

  console.log(
    `[Scoring] Created ${periods.length} periods for league ${leagueId}`,
  );
  return data;
}

// ─── RUČNI TRIGGER ZA TESTIRANJE ────────────────────────────────
// Dodaj test performansu i odmah izračunaj
export async function addTestPerformanceAndScore(leagueId, chessPlayerId) {
  // Nađi ili kreiraj test turnir
  let { data: tournament } = await supabaseAdmin
    .from("tournaments")
    .select("id")
    .eq("source", "lichess")
    .eq("external_id", "test-tournament-1")
    .single();

  if (!tournament) {
    const { data: newTournament } = await supabaseAdmin
      .from("tournaments")
      .insert({
        name: "Test Tournament",
        source: "lichess",
        external_id: "test-tournament-1",
        time_control: "rapid",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        is_finished: true,
        weight_multiplier: 1.0,
      })
      .select()
      .single();
    tournament = newTournament;
  }

  // Dodaj test performansu
  const { data: perf } = await supabaseAdmin
    .from("player_performances")
    .upsert(
      {
        chess_player_id: chessPlayerId,
        tournament_id: tournament.id,
        final_rank: 1,
        score: 7.5,
        rating_before: 2800,
        rating_after: 2815,
        wins: 7,
        losses: 1,
        draws: 1,
        upsets_scored: 2,
        performance_rating: 2900,
      },
      { onConflict: "chess_player_id,tournament_id" },
    )
    .select()
    .single();

  console.log("[Scoring] Test performance added:", perf);
  return { tournament, performance: perf };
}
