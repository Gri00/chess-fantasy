import { api } from './api'

export const leagueService = {
  async getMyLeagues() {
    const { data } = await api.get('/leagues/mine')
    return data.leagues
  },

  async createLeague(payload: {
    name: string
    team_name: string
    league_type?: string
    roster_size?: number
    max_teams?: number
    description?: string
  }) {
    const { data } = await api.post('/leagues', payload)
    return data.league
  },

  async joinByCode(invite_code: string, team_name: string) {
    const { data } = await api.post('/leagues/join', { invite_code, team_name })
    return data
  },

  async getLeague(id: string) {
    const { data } = await api.get(`/leagues/${id}`)
    return data.league
  },

  async getStandings(id: string) {
    const { data } = await api.get(`/leagues/${id}/standings`)
    return data.standings
  },

  async leaveLeague(id: string) {
  const { data } = await api.delete(`/leagues/${id}/leave`)
  return data
},
}