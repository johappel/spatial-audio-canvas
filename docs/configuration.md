# Konfiguration, Einstellungen und Hinweise

Zentrale Anlaufstelle fuer einstellbare Werte, Betriebshinweise und
Erweiterungspunkte. Wenn du an Schwellen, Lautstaerken oder dem visuellen
Feedback drehst, dokumentiere die Aenderung am besten hier.

## 1. Umgebungsvariablen (.env)

Vorlage: `.env.example`. Vite liest `.env` nur beim Start - nach Aenderungen den
Dev-Server neu starten.

| Variable                | Zweck                                   | Beispiel                          |
| ----------------------- | --------------------------------------- | --------------------------------- |
| `VITE_SIGNALING_URL`    | WebSocket-Signalling-Endpoint           | `ws://localhost:8766`             |
| `VITE_STUN_URLS`        | STUN-Server (kommagetrennt)             | `stun:stun.l.google.com:19302`    |
| `VITE_TURN_URL`         | optionaler TURN-Server                  | `turns:host.example:5349`         |
| `VITE_TURN_USERNAME`    | TURN-Benutzer                           | -                                 |
| `VITE_TURN_CREDENTIAL`  | TURN-Passwort                           | -                                 |

Ist `VITE_SIGNALING_URL` leer, laeuft die App im **Offline-Demo-Modus**
(simulierte Stimmen Karl/Erna/Maria, keine echten Verbindungen).

## 2. Signalling-Server (server/signaling.mjs)

- Start: `npm run signaling` (Standardport **8766**, ueberschreibbar mit `PORT`).
- Port belegt? Fehler `EADDRINUSE`. Belegung pruefen:
  `Get-NetTCPConnection -LocalPort 8766 -State Listen` und ggf. anderen Port
  waehlen: `PORT=8777 npm run signaling` + `.env` anpassen.
- Es laufen **keine Audiodaten** ueber den Server, nur der Verbindungsaufbau.

## 3. Audio- und Animations-Tuning

### Sprachpegel (src/audio/VoiceLevelAnalyser.ts)

| Konstante           | Standard | Wirkung                                                        |
| ------------------- | -------- | -------------------------------------------------------------- |
| `LEVEL_SMOOTHING`   | `0.5`    | Glaettung. Hoeher (0.7-0.8) = ruhiger/traeger, niedriger = reaktiver, flackert eher. |
| `SPEAKING_THRESHOLD`| `0.02`   | Ab welchem RMS-Pegel als "spricht" gilt.                       |

Glaettungsformel: `geglaettet = vorher * SMOOTHING + aktuell * (1 - SMOOTHING)`.

### Sprech-Erkennung (src/app/AppController.ts)

In den drei Mess-Schleifen (lokal / simuliert / remote):

- `level > 0.02` - Schwelle, ab der ein Punkt als sprechend gilt. Niedriger =
  empfindlicher, kann bei Hintergrundgeraeusch flackern.
- `Math.abs(level - ...) > 0.015` - wie fein Pegelaenderungen in den Store
  geschrieben werden (Anzeige-Granularitaet). Niedriger = fluessiger, mehr Renders.

### Visuelles Feedback (src/ui/ParticipantDot.ts)

- `toIntensity(level) = min(1, sqrt(level) * 2.8)` - wahrnehmungsgerechte
  Verstaerkung. Faktor `2.8` erhoehen = leise Stimmen staerker sichtbar.
- `active = intensity > 0.04` - ab wann Ring/Glow erscheinen.
- `scale = 1 + intensity * 0.45` - maximale Vergroesserung beim Sprechen.
- Bei `prefers-reduced-motion` entfaellt das Zoomen; Ring/Helligkeit bleiben als
  ruhigeres Signal.

### Raeumliches Hoeren (src/audio/VoiceSpatializer.ts)

- `computePan(relativeX)` - begrenzt auf +/- 0.65 (nicht hart links/rechts).
- `computeGain(distance, sameIsland)` - andere Insel = `0.08` (leise), sonst
  `max(0.25, 1 - distance * 0.25)`.

### Hintergrund-Klangbett (src/audio/AmbientBed.ts)

- `MAX_GAIN = 0.35` - Obergrenze der Ambiente-Lautstaerke (bewusst leise, damit
  Stimmen wichtiger bleiben). Der Schieberegler skaliert 0..1 auf 0..MAX_GAIN.

## 4. Design (src/styles/tokens.css)

Alle Farben, Abstaende, Radien, Tap-Ziele und Bewegungsdauer sind CSS Custom
Properties (`--sac-*`). Sie durchdringen auch Shadow-DOM-Grenzen und sind die
zentrale Stellschraube fuer Themes. Hochkontrast-Theme: `body.sac-high-contrast`.

## 5. Raeume und Inseln (public/rooms/*.json)

Ein Raum (`RoomConfig`) enthaelt mehrere `ConversationIsland`s mit festen
`Seat`s. Geladen wird beim Start `demo-table` (siehe `src/main.ts` ->
`controller.init('demo-table')`). Mehr als eine Insel blendet die
Inselwechsel-Leiste ein.

Seat-Koordinaten: `x` = links/rechts, `z` = vorne/hinten; `angleDeg` = Position
auf dem Kreis (0 Grad oben, im Uhrzeigersinn). Hilfsberechnung:
`computeSeatPositions(count)` in `src/room/SeatLayout.ts`.

## 6. Erweiterungspunkte (kein Kernumbau noetig)

| Ziel                | Wo                                                     |
| ------------------- | ------------------------------------------------------ |
| Neues Plugin        | `src/plugins/<name>/`, in `src/plugins/index.ts` registrieren |
| Neuer Klang-Typ     | `ctx.klangNodes.register(factory)` (KlangNodeRegistry) |
| Neuer Medientyp     | `media.register(handler)` (MediaSourceRegistry)        |
| Neue UI-Region      | `ctx.ui.mount(region, contribution)`                   |
| Neue Nachrichtenart | `ctx.sendMessage(channel, type, payload)` + Listener auf `message:received` |

## 7. Tests und Build

- `npm test` - Unit-Tests (Geometrie, Perspektive, Pan/Gain/Glaettung).
- `npm run build` - Typecheck + Produktionsbuild nach `dist/`.
- `npm run dev` - Dev-Server mit Hot-Reload.

## 8. Weltkarte und Spatialisierung (src/room/WorldLayout.ts)

Alle Inseln liegen in EINEM Koordinatenraum (keine getrennten Kanaele). Die
Karte ist stabil; beim Platz-/Inselwechsel gleitet der eigene Avatar ueber den
Canvas. Nachbarinseln sind sichtbar (gedimmt) und allein durch Distanz leiser.

| Wert            | Datei            | Wirkung                                              |
| --------------- | ---------------- | ---------------------------------------------------- |
| `ISLAND_SPACING`| WorldLayout.ts   | Abstand der Inselzentren (groesser = Inseln weiter auseinander, andere Insel leiser). |
| `SEAT_RADIUS`   | WorldLayout.ts   | Radius der Sitze um das Inselzentrum.                |
| `STAGE_ASPECT`  | WorldLayout.ts   | Seitenverhaeltnis der Buehne; Canvas nutzt denselben Wert (Kreise bleiben rund). |
| `PADDING`       | WorldLayout.ts   | Rand im Canvas.                                      |
| Pan-Faktor      | `spatialFor` (`* 1.5`) | Wie stark seitliche Position auf das Stereo-Pan wirkt (geklemmt auf +/-0.65). |
| Gain-Abfall     | `spatialFor` (`1 - dist * 1.2`, min 0.06) | Wie schnell entfernte Quellen leiser werden. |

Inselpositionen kommen aus `centerX`/`centerY` der Raumkonfiguration
(`public/rooms/*.json`). Verschiebe Inseln dort, um die Anordnung zu aendern.

Bewegungsanimation: `src/ui/WorldCanvas.ts`, CSS-Transition `left/top 600ms`.
Bei `prefers-reduced-motion` entfaellt das Gleiten (Klasse `.node.reduced`).