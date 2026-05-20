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
EAS Build:

Pokreni npx eas-cli init u mobile/ folderu — generiše novi projectId i linkuje za njihov nalog.
---

## Pokretanje — Backend

### Windows (PowerShell)

```powershell
cd M:\projects\chess-fantasy\backend

npm install
npm run dev
```

### Mac (Terminal / zsh)

```bash
cd ~/Projects/chess-fantasy/backend

npm install
npm run dev
```

> Server radi na `http://localhost:3000` — health check: `http://localhost:3000/health`

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

### Windows (PowerShell)

```powershell
cd M:\projects\chess-fantasy\mobile

npm install
npx expo start
```

### Mac (Terminal / zsh)

```bash
cd ~/Projects/chess-fantasy/mobile

npm install
npx expo start
```

**Opcije nakon pokretanja:**
- `i` — iOS simulator (Mac only)
- `a` — Android emulator
- `s` — prebaci na Expo Go / Development Build
- Skeniraj QR kod telefonom

> **Važno:** Backend mora da radi pre nego što pokreneš mobile app.
> Provjeri IP adresu u `mobile/services/api.ts` — mora da matchuje tvoj lokalni IP.

---

## iOS Development Build (umesto Expo Go)

Sa Apple Developer Accountom možeš buildovati sopstvenu dev app koja nema ograničenja Expo Go sandboxa.

### Setup (jednom)

```bash
# Instaliraj expo-dev-client
cd ~/Projects/chess-fantasy/mobile
npx expo install expo-dev-client

# Prijavi se na EAS
npx eas-cli login

# Povezi Apple credentials (certifikati, APNs)
npx eas-cli credentials --platform ios

# Napravi development build i instaliraj na iPhone
npx eas-cli build --profile development --platform ios
```

### Svakodnevni razvoj

```bash
cd ~/Projects/chess-fantasy/mobile

# Pokreni dev server (otvoriš na Development Build app na iPhoneu)
npx expo start --dev-client
```

### EAS Build profili (`eas.json`)

```json
{
  "cli": { "version": ">= 14.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

> Napravi `eas.json` fajl u `mobile/` folderu sa sadržajem iznad.

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

Git komande su iste na Windowsu i Macu:

```bash
git status
git add .
git commit -m "feat: opis promene"
git push origin main
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

## Testiranje API endpointa

### Mac (Terminal / zsh)

```bash
# Login i čuvanje tokena
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' | jq -r '.token')

# Health check
curl http://localhost:3000/health

# Moje lige
curl http://localhost:3000/leagues/mine \
  -H "Authorization: Bearer $TOKEN"

# Svi igrači
curl http://localhost:3000/players \
  -H "Authorization: Bearer $TOKEN"

# Igrači po tieru
curl "http://localhost:3000/players?tier=S" \
  -H "Authorization: Bearer $TOKEN"

# Kreiraj ligu
curl -X POST http://localhost:3000/leagues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Liga","team_name":"Moj Tim","roster_size":5}'

# Pridruži se ligi
curl -X POST http://localhost:3000/leagues/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"invite_code":"XXXXXXXX","team_name":"Moj Tim"}'

# Dodaj igrača na roster
curl -X POST http://localhost:3000/players/roster/LEAGUE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"chess_player_id":"PLAYER_ID"}'
```

> `jq` je potreban za parsiranje JSON-a — instaliraj sa `brew install jq`

### Windows (PowerShell)

```powershell
# Login i čuvanje tokena
$response = curl -Method POST http://localhost:3000/auth/login `
  -ContentType "application/json" `
  -Body '{"email":"test@test.com","password":"123456"}' `
  -UseBasicParsing
$token = ($response.Content | ConvertFrom-Json).token

# Health check
curl http://localhost:3000/health -UseBasicParsing

# Moje lige
curl http://localhost:3000/leagues/mine `
  -Headers @{"Authorization"="Bearer $token"} -UseBasicParsing

# Svi igrači
curl http://localhost:3000/players `
  -Headers @{"Authorization"="Bearer $token"} -UseBasicParsing
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
