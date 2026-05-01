import { api } from "./api";

export const liveService = {
  async getLiveGames(): Promise<{ games: LiveGame[]; live: boolean }> {
    const { data } = await api.get("/live/games");
    return data;
  },

  async getLiveGame(id: string): Promise<{ game: GameDetail; live: boolean }> {
    const { data } = await api.get(`/live/games/${id}`);
    return data;
  },
};

export interface LiveGame {
  id: string;
  variant: string;
  player: {
    name: string;
    id: string | null;
    title: string | null;
    rating: number | null;
    color: string;
  };
  url: string;
}

export interface GameDetail {
  id: string;
  variant: string;
  status: string;
  fen: string | null;
  moves: string;
  opening?: { name: string; eco?: string };
  players?: {
    white?: { user?: { name: string; title?: string }; rating?: number };
    black?: { user?: { name: string; title?: string }; rating?: number };
  };
}
