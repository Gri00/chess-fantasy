import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import 'dotenv/config'

import authRoutes from './routes/auth.js'
import leagueRoutes from './routes/leagues.js'
import playerRoutes from './routes/players.js'
import scoringRoutes from './routes/scoring.js'
import liveRoutes from './routes/live.js'

const app = Fastify({ logger: true })

await app.register(cors, { origin: '*' })
await app.register(jwt, { secret: process.env.JWT_SECRET })

await app.register(authRoutes, { prefix: '/auth' })
await app.register(leagueRoutes, { prefix: '/leagues' })
await app.register(playerRoutes, { prefix: '/players' })
await app.register(scoringRoutes)
await app.register(liveRoutes, { prefix: '/live' })

app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString()
}))

try {
  await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
