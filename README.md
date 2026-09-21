# Hässleholm Entreprenad AB – CRM &amp; Planering

Ett CRM- och planeringssystem för ett litet entreprenadbolag i Hässleholm.
Appen körs i webbläsaren på mobil, surfplatta och dator, och är byggd för att
deployas som **ett enda Vercel-projekt**:

- **Frontend:** React + Vite (mobil-först, svenskt gränssnitt).
- **Backend:** Vercel serverless-funktioner i `/api` som proxar
  [OpenRouteService](https://openrouteservice.org/) (ruttning, avståndsmatris,
  ruttoptimering och geokodning).
- **Karta:** [Leaflet](https://leafletjs.com/) med OpenStreetMap-kartor (gratis,
  ingen nyckel krävs).
- **Datalagring:** `localStorage` i webbläsaren bakom ett repository-lager
  (`src/lib/storage.js`) som gör det enkelt att senare byta till en hostad
  databas.

## Funktioner

- **Översikt** – dagens uppdrag, vem gör vad, var maskinerna står.
- **Uppdrag** – CRM-lista med filter på typ/ansvarig/status samt formulär för
  nya uppdrag.
- **Uppdragsvy** – platsinformation (koordinater, adress, körtid/sträcka från
  kontoret), beskrivning, resurser/maskiner med transportplanering,
  tidsplanering, noteringar och filuppladdning (t.ex. foton på färdigt
  arbete).
- **Karta** – kontor, uppdrag (färg efter status, ikon efter typ) och maskiner
  som markörer, samt knapp för att optimera och rita dagens körrutt längs
  verkliga vägar.
- **Maskiner/Resurser** – lista över maskinparken, aktuell plats, bokningar
  och transportöversikt.
- **Planering/Schema** – dag- och veckovy med uppdrag, tider och
  maskinbokningar. Krockande maskinbokningar markeras tydligt.

Två användare (Bertil och Ove) kan enkelt växlas mellan i headern – ingen
inloggning krävs.

## Arkitektur i korthet

```
/
├── api/                  # Vercel serverless-funktioner (Node, ESM)
│   ├── _lib/ors.js       # Delad hjälpkod (proxar ej till egen endpoint)
│   ├── directions.js     # POST – rutt längs vägar, körtid & sträcka
│   ├── matrix.js         # POST – avståndsmatris kontor/uppdrag
│   ├── optimization.js   # POST – bästa besöksordning (VROOM/ORS)
│   └── geocode.js        # GET  – adress <-> koordinater
├── src/
│   ├── lib/               # ORS-klient, datalager, seed-data, hjälpfunktioner
│   ├── context/            # Global state (AppContext)
│   ├── components/         # Återanvändbara komponenter (kort, formulär, karta)
│   └── pages/               # De sex vyerna i appen
├── vercel.json            # SPA-rewrites så klientsidans routing funkar
└── .env.example            # Mall för miljövariabeln ORS_API_KEY
```

**Viktigt om säkerhet:** ORS-nyckeln läses endast av koden i `/api` via
`process.env.ORS_API_KEY`. Den har **inte** `VITE_`-prefix och skickas
**aldrig** till webbläsaren – frontend anropar alltid våra egna `/api`-rutter,
som i sin tur pratar med OpenRouteService.

## Kör lokalt

### Förutsättningar

- [Node.js](https://nodejs.org/) 18 eller senare
- Ett gratis konto och API-nyckel på
  [openrouteservice.org](https://openrouteservice.org/dev/#/signup)
- [Vercel CLI](https://vercel.com/docs/cli) (för att köra `/api`-funktionerna
  lokalt): `npm install -g vercel`

### 1. Installera beroenden

```bash
npm install
```

### 2. Sätt din ORS-nyckel lokalt

```bash
cp .env.example .env
# Öppna .env och fyll i din egen ORS_API_KEY
```

`.env` är redan listad i `.gitignore` och committas aldrig.

### 3a. Enbart frontend (utan karta/ruttning mot ORS)

```bash
npm run dev
```

Öppna `http://localhost:5173`. Alla vyer fungerar, men anrop till
`/api/*`-funktionerna (ruttning, avstånd, optimering, geokodning) går inte
att nå eftersom Vite inte kör serverless-funktioner.

### 3b. Frontend + API (rekommenderas)

```bash
vercel dev
```

Detta startar både React-appen och `/api`-funktionerna lokalt, med samma
beteende som i produktion. Följ instruktionerna i terminalen för att länka
till ett (nytt eller befintligt) Vercel-projekt första gången.

## Bygg för produktion

```bash
npm run build
```

Bygger den statiska frontend-koden till `dist/`.

## Pusha till GitHub

```bash
git init                                   # redan gjort i detta repo
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<ditt-användarnamn>/<repo-namn>.git
git push -u origin main
```

## Koppla till Vercel och deploya

1. Gå till [vercel.com](https://vercel.com/) och skapa ett nytt projekt, eller
   kör `vercel` i projektmappen och följ guiden.
2. Välj GitHub-repot du precis pushade. Vercel känner automatiskt igen
   Vite-projektet (build-kommando `npm run build`, output-mapp `dist`) och
   `/api`-mappen som serverless-funktioner.
3. **Sätt miljövariabeln:** Under **Project Settings → Environment Variables**,
   lägg till:
   - **Name:** `ORS_API_KEY`
   - **Value:** din OpenRouteService-nyckel
   - **Environment:** Production (och gärna Preview/Development)

   Lägg **aldrig** nyckeln i koden eller i en committad fil.
4. Deploya (sker automatiskt vid varje push till huvudgrenen, eller manuellt
   via `vercel --prod`).

Efter deploy geokodas kontorsadressen (Norra Kringelvägen 70, Hässleholm)
automatiskt vid första sidladdningen och cachas i webbläsarens
`localStorage`, tillsammans med startdata för uppdrag och maskinpark.

## Datalagring och framtida databas

All data (uppdrag, maskiner, aktuell användare, kontorsplats) läses och
skrivs via `src/lib/storage.js`. Varje funktion är redan `async`, så att byta
ut `localStorage`-implementationen mot t.ex. anrop till en hostad databas
(Postgres, Supabase, Firebase m.fl.) senare bara kräver ändringar i den
filen – resten av appen behöver inte röras.

## Teknikstack

- React 18 + React Router
- Vite 5
- Leaflet + react-leaflet (OpenStreetMap-tiles)
- Vercel serverless-funktioner (Node, ESM) som proxar OpenRouteService
  Directions, Matrix, Optimization och Geocoding-API:er
