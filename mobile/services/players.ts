import { api } from './api'

export const playerService = {
  async getPlayers(params?: {
    page?: number
    tier?: string
    search?: string
    league_id?: string
  }) {
    const { data } = await api.get('/players', { params })
    return data
  },

  async getAvailable(league_id: string, params?: { tier?: string, search?: string }) {
    const { data } = await api.get(`/players/available/${league_id}`, { params })
    return data
  },

  async getRoster(league_id: string) {
    const { data } = await api.get(`/players/roster/${league_id}`)
    return data.roster
  },

  async addToRoster(league_id: string, chess_player_id: string) {
    const { data } = await api.post(`/players/roster/${league_id}`, { chess_player_id })
    return data
  },

  async removeFromRoster(league_id: string, chess_player_id: string) {
    const { data } = await api.delete(`/players/roster/${league_id}/${chess_player_id}`)
    return data
  }
}