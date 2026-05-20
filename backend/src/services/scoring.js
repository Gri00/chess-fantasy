import { supabaseAdmin } from "../services/supabase.js";

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

export function calculatePlayerScore(
  performance,
  tournament,
  rules = DEFAULT_RULES,
) {
  const r = { ...DEFAULT_RULES, ...rules };
  let points = 0;
  const breakdown = {};

  const multiplierKey = `${tournament.time_control}_multiplier`;
  const timeMultiplier = r[multiplierKey] ?? 1.0;
  const tournamentWeight = tournament.weight_multiplier ?? 1.0;

  const winPoints = performance.wins * r.win_vs_lower;
  breakdown.wins = winPoints;
  points += winPoints;

  const drawPoints = performance.draws * r.draw_vs_lower;
  breakdown.draws = drawPoints;
  points += drawPoints;

  const lossPoints = performance.losses * r.loss;
  breakdown.losses = lossPoints;
  points += lossPoints;

  if (performance.upsets_scored > 0) {
    const upsetPoints = performance.upsets_scored * r.upset_bonus;
    breakdown.upsets = upsetPoints;
    points += upsetPoints;
  }

  if (performance.rating_change > 0) {
    const ratingPoints = performance.rating_change * r.rating_gain_per_point;
    breakdown.rating_gain = parseFloat(ratingPoints.toFixed(2));
    points += ratingPoints;
  }

  if (performance.final_rank === 1) {
    breakdown.tournament_win_bonus = r.tournament_win_bonus;
    points += r.tournament_win_bonus;
  } else if (performance.final_rank <= 3) {
    breakdown.top3_bonus = r.top3_bonus;
    points += r.top3_bonus;
  }

  points = points * timeMultiplier;
  breakdown.time_multiplier = timeMultiplier;

  points = points * tournamentWeight;
  breakdown.tournament_weight = tournamentWeight;

  return {
    points: parseFloat(points.toFixed(2)),
    breakdown,
  };
}

export async function processScoringPeriod(periodId) {
  const { data: period, error: periodError } = await supabaseAdmin
    .from("scoring_periods")
    .select("*, league:leagues(id, scoring_rules, roster_size)")
    .eq("id", periodId)
    .single();

  if (periodError || !period) {
    throw new Error(`Period ${periodId} not found`);
  }

  if (period.is_finalized) {
    return;
  }

  const rules = period.league.scoring_rules;

  const { data: members } = await supabaseAdmin
    .from("league_members")
    .select("id, user_id, team_name")
    .eq("league_id", period.league.id);

  if (!members || members.length === 0) {
    return;
  }

  const { data: tournaments } = await supabaseAdmin
    .from("tournaments")
    .select("*")
    .gte("start_date", period.start_date)
    .lte("end_date", period.end_date)
    .eq("is_finished", true);

  if (!tournaments || tournaments.length === 0) {
    return;
  }

  const tournamentIds = tournaments.map((t) => t.id);
  const tournamentMap = Object.fromEntries(tournaments.map((t) => [t.id, t]));

  const scoreInserts = [];

  for (const member of members) {
    const { data: roster } = await supabaseAdmin
      .from("rosters")
      .select("chess_player_id")
      .eq("league_member_id", member.id);

    if (!roster || roster.length === 0) continue;

    const playerIds = roster.map((r) => r.chess_player_id);

    const { data: performances } = await supabaseAdmin
      .from("player_performances")
      .select("*")
      .in("chess_player_id", playerIds)
      .in("tournament_id", tournamentIds);

    if (!performances || performances.length === 0) continue;

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

  if (scoreInserts.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from("fantasy_scores")
      .upsert(scoreInserts, {
        onConflict: "league_member_id,scoring_period_id,chess_player_id",
      });

    if (insertError) {
      throw new Error(`Error inserting scores: ${insertError.message}`);
    }
  }

  await supabaseAdmin
    .from("scoring_periods")
    .update({ is_finalized: true, finalized_at: new Date().toISOString() })
    .eq("id", periodId);

  return { processed: scoreInserts.length };
}

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

  return data;
}

export async function addTestPerformanceAndScore(leagueId, chessPlayerId) {
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

  return { tournament, performance: perf };
}
