import { api } from "./api";

export interface Broadcast {
  id: string;
  name: string;
  slug: string;
  tier: number;
  image: string | null;
  round: { id: string; name: string; url: string | null };
}

export interface BroadcastGame {
  id: string;
  round: string | null;
  white: { name: string; rating: number | null; title: string | null };
  black: { name: string; rating: number | null; title: string | null };
  opening: { name: string; eco: string | null } | null;
  moves: string;
  result: string;
  status: string;
  fen: string;
}

export const broadcastService = {
  async getBroadcasts(): Promise<Broadcast[]> {
    const { data } = await api.get("/broadcasts");
    return data.broadcasts;
  },

  async getRoundGames(roundId: string): Promise<BroadcastGame[]> {
    const { data } = await api.get(`/broadcasts/${roundId}/games`);
    return data.games;
  },
};
