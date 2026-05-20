# ChessFantasy — Project Status

## Tech Stack

| Layer | Tehnologija |
|---|---|
| Mobile | React Native 0.81 + Expo 54 + TypeScript |
| Routing | Expo Router (file-based) |
| State | Zustand |
| HTTP | Axios |
| Backend | Node.js + Fastify 5 |
| Baza | PostgreSQL via Supabase |
| Auth | Custom JWT (@fastify/jwt) |
| Player data | Chess.com Public API |
| Live data | Lichess API (broadcasts + TV) |
| Push notif. | Expo Notifications (APNs pending) |
| Build | EAS Build |

---

## Arhitektura

### Mobile

Expo Router sa file-based rutama. Screens u `app/`, logika za API pozive u `services/`, globalni auth state u Zustand store (`stores/useAuthStore.ts`). Svi HTTP zahtevi idu kroz `services/api.ts` koji automatski ubacuje JWT token iz SecureStore-a i odjavljuje usera na 401.

```
app/
  (auth)/     — login, register, onboarding
  (tabs)/     — index (home), leagues, players, live, profile
  league/     — detail, pick, team
  broadcast/  — round, game
  live/       — game
  notifications, player/[username], modal
services/     — api, auth, leagues, players, live, broadcasts, notifications
stores/       — useAuthStore, useLeagueStore
```

### Backend

Node.js + Fastify, pokreće se lokalno. Komunicira sa Supabase-om preko `@supabase/supabase-js` (service role key, zaobilazi RLS). JWT autentikacija je odvojena od Supabase Auth — Supabase se koristi samo kao baza.

```
src/
  routes/     — auth, leagues, players, scoring, live, broadcasts
  services/   — supabase, chesscom, lichess, scoring, notifications
  middleware/ — authenticate (JWT verify)
  db/         — supabase client init
```

Player lista dolazi sa Chess.com Public API-ja (top 200 igrači po formatu), keširano u memoriji 5 minuta. Live partije dolaze sa Lichess API-ja.

### Baza (Supabase)

Tabele: `users`, `leagues`, `league_members`, `chess_players`, `rosters`, `scoring_periods`, `fantasy_scores`, `player_performances`, `tournaments`

Views: `league_standings`, `roster_details`

RLS politike su konfigurisane ali ih backend zaobilazi service role ključem.

---

## Implementirane funkcionalnosti

### Auth
- Registracija (email, password, username)
- Login / logout
- Token u SecureStore, auto-inject na sve requeste
- Auto-logout na 401

### Leagues
- Kreiranje lige (commissioner)
- Pridruživanje invite kodom
- Pridruživanje javnoj ligi (po ID-u) — samo backend endpoint, nema UI
- Pregled detalja lige (roster, standings, info tab)
- Napuštanje lige
- Izbacivanje člana (samo commissioner)
- Brisanje lige (samo commissioner, samo pending)
- Deljenje invite koda

### Players
- Browse lista (paginated, Chess.com API)
- Search po imenu/username-u
- Filter po tier-u (S/A/B/C/D)
- Detalji igrača
- Dodavanje na roster
- Uklanjanje sa rostera

### Scoring (backend only, nema UI)
- `calculatePlayerScore` — wins/draws/losses + upset bonus + rating gain + time control multiplier + tournament weight
- `POST /leagues/:id/activate` — aktivira ligu i kreira nedeljne scoring periode
- `POST /leagues/:id/score/:period_id` — manuelno pokreće scoring za period
- `GET /leagues/:id/scores` — scorovi za period
- `GET /leagues/:id/periods` — lista svih perioda

### Live
- Home ekran: live partije sa Lichess broadcast-a ili TV-a kao fallback
- Live tab: lista live partija
- Broadcast game detalji
- TV game sa šahovskom tablom (`ChessBoard` komponenta)

### Push notifikacije
- Registracija tokena pri loginu (Expo push token → backend)
- Notifikacija komisaru kada neko uđe u ligu
- `useNotificationListeners` postoji, treba APNs setup (Apple Developer Account)

---

## Infrastrukturni problemi

### Baza — Supabase Free Tier

**Problem:** Free plan pauzira bazu posle 7 dana neaktivnosti. Storage limit 500MB, API rate limiti, nema custom domenova.

### Backend — lokalno

**Problem:** `mobile/services/api.ts` ima hardkodovan IP. Telefon i računar moraju biti na istoj WiFi mreži. Ne može u produkciju ovako.

Kada se deploya backend, u `services/api.ts` se menja samo `BASE_URL`.

---

## Hardkodovano / nedostaje

### Home ekran (`app/(tabs)/index.tsx`)

**`MOCK_LINEUP`** — 4 hardkodovana igrača (Carlsen, Pragg, Wei Yi, Aronian).
Treba: API poziv koji dohvata roster iz korisnikove aktivne lige. Problem je što user može imati više liga — treba logika za "primarnu" ligu ili da se prikazuje iz poslednje aktivne.

**Season banner** — "World Chess Championship", "#47", "Round 6 of 14", "Ends in 3d 14h", "2,847 pts" su sve hardkodovane vrednosti.
Treba: standings data iz aktivne lige + trenutni scoring period.

**Quick stats** — "2,847 pts", "Carlsen", "+340 this week" su hardkodovani.
Treba: poziv na `GET /leagues/:id/scores` za tekući period.

### Profile ekran (`app/(tabs)/profile.tsx`)

**`MOCK_ACHIEVEMENTS`** — "First Blood", "Champion", "Grand Master" nemaju backend logiku.
Treba: tabela `achievements` u bazi, logika za unlock (npr. prva pobeda u standings, osvajanje sezone).

**`MOCK_BARS` (weekly chart)** — 7 hardkodovanih vrednosti.
Treba: `GET /leagues/:id/scores` po periodu, prikazati poslednjih 7 perioda.

**Hero stats** — "#12 Best Rank", "18.4K Total Pts", "68% Win Rate" su hardkodovani.
Treba: agregirane statistike iz `fantasy_scores` za usera.

**"Grand Master Tier"** — hardkodovan string pored usernamea.
Treba: sistem rang titula baziran na fantasy performansama.

**"Top Player" / "TOP 1%" badges** — hardkodovani.
Treba: percentil kalkulacija nad standings-ima.

**Settings rows** — 4 stavke (Manage Subscription, Notifications, Privacy, Help) nemaju `onPress` navigaciju. Ni jedna nije funkcionalna.
Treba: ekrani ili modali za svaku, ili ih ukloniti dok se ne implementiraju.

### Notifications ekran (`app/notifications.tsx`)

**`MOCK_NOTIFICATIONS`** — 4 hardkodovane notifikacije.
Infrastruktura postoji (Expo push token, `useNotificationListeners`) ali nema tabele za čuvanje primljenih notifikacija ni API-ja za dohvatanje istorije.
Treba: tabela `notifications` u bazi, endpoint za listu, čuvanje pri prijemu.

### Leagues ekran (`app/(tabs)/leagues.tsx`)

**Aktivacija lige (Start Season)** — backend endpoint `POST /leagues/:id/activate` postoji i kreira nedeljne scoring periode, ali nema UI dugme za to.
Treba: dugme "Start Season" vidljivo samo komisaru kada je liga `pending` i ima postavljen `season_start`/`season_end`.

**Datumi sezone pri kreiranju** — `season_start`, `season_end`, `picks_deadline` postoje u API-ju ali Create League forma ih ne prikazuje.
Treba: date picker u create dijalogu.

**Browse javnih liga** — `GET /leagues` endpoint postoji i vraća javne pending lige, ali nema browse tab/ekran za to.

### Opšte

**Kapiten** — "C" badge postoji u MOCK_LINEUP-u ali nema kapiten mehanike u stvarnom roster sistemu (bez kapiten polja u `rosters` tabeli, bez multiplier-a za kapitena).

**Scoring automatizacija** — scoring se pokreće manuelno sa `POST /leagues/:id/score/:period_id`. Nema cron job-a za automatsko procesiranje kada se period završi.

**Style i ikonice** - Generalno sve.
