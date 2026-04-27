# ♟ ChessFantasy

Fantasy liga bazirana na šahu — korisnici biraju GM-ove, skupljaju poene na osnovu stvarnih rezultata na turnirima.

---

## Struktura projekta

```
chess-fantasy/
├── backend/        # Node.js + Fastify API
├── mobile/         # React Native + Expo
└── supabase/       # SQL migracije
```

---

## Pokretanje — Backend

```powershell
cd M:\projects\chess-fantasy\backend

# Instaliraj dependencies (samo prvi put)
npm install

# Pokreni development server
npm run dev

# Server radi na http://localhost:3000
# Health check: http://localhost:3000/health
```

### Environment varijable (`backend/.env`)

```env
PORT=3000
JWT_SECRET=...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:...
```

---

## Pokretanje — Mobile

```powershell
cd M:\projects\chess-fantasy\mobile

# Instaliraj dependencies (samo prvi put)
npm install

# Pokreni Expo
npx expo start

# Opcije nakon pokretanja:
# i — iOS simulator (treba Mac)
# a — Android emulator
# Skeniraj QR kod — otvori u Expo Go na iPhoneu
```

> **Važno:** Backend mora da radi pre nego što pokreneš mobile app.
> Provjeri IP adresu u `mobile/services/api.ts` — mora da matchuje IP iz nodemon loga.

---

## Supabase migracije

Pokreni u **Supabase Dashboard → SQL Editor** redom:

```
supabase/migrations/20240001_init_enums.sql
supabase/migrations/20240002_core_tables.sql
supabase/migrations/20240003_rls_policies.sql
supabase/migrations/20240004_functions_views.sql
supabase/migrations/20240005_seed_players.sql
```

---

## Git — svakodnevne komande

```powershell
# Provjeri status promjena
git status

# Dodaj sve promene
git add .

# Commit sa porukom
git commit -m "feat: opis promene"

# Push na GitHub
git push origin main

# Pull najnovije promene
git pull origin main
```

### Konvencija za commit poruke

```
feat: nova funkcionalnost
fix: ispravka buga
style: promjene UI/stilova
refactor: refaktorisanje koda
docs: promjene dokumentacije
chore: ostalo (dependencies, config...)
```

---

## Testiranje API endpointa (PowerShell)

```powershell
# Login i čuvanje tokena
$response = curl -Method POST http://localhost:3000/auth/login `
  -ContentType "application/json" `
  -Body '{"email":"test@test.com","password":"123456"}' `
  -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
$token = $json.token

# Health check
curl http://localhost:3000/health -UseBasicParsing

# Moje lige
curl http://localhost:3000/leagues/mine `
  -Headers @{"Authorization"="Bearer $token"} `
  -UseBasicParsing

# Svi igrači
curl http://localhost:3000/players `
  -Headers @{"Authorization"="Bearer $token"} `
  -UseBasicParsing

# Igrači po tieru
curl "http://localhost:3000/players?tier=S" `
  -Headers @{"Authorization"="Bearer $token"} `
  -UseBasicParsing

# Kreiraj ligu
curl -Method POST http://localhost:3000/leagues `
  -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $token"} `
  -Body '{"name":"Test Liga","team_name":"Moj Tim","roster_size":5}' `
  -UseBasicParsing

# Pridruži se ligi
curl -Method POST http://localhost:3000/leagues/join `
  -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $token"} `
  -Body '{"invite_code":"XXXXXXXX","team_name":"Moj Tim"}' `
  -UseBasicParsing

# Dodaj igrača na roster
curl -Method POST http://localhost:3000/players/roster/LEAGUE_ID `
  -ContentType "application/json" `
  -Headers @{"Authorization"="Bearer $token"} `
  -Body '{"chess_player_id":"PLAYER_ID"}' `
  -UseBasicParsing
```

---

## Tech stack

| Layer       | Tehnologija                      |
| ----------- | -------------------------------- |
| Mobile      | React Native + Expo + TypeScript |
| Routing     | Expo Router                      |
| State       | Zustand                          |
| Backend     | Node.js + Fastify                |
| Baza        | PostgreSQL (Supabase)            |
| Auth        | Supabase Auth + JWT              |
| Push notif. | Expo Notifications + APNs        |
| Build       | EAS Build                        |

---
