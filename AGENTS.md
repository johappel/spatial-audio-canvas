# AGENTS.md – Spatial Audio Canvas als Begegnungsraum

## Projektname

**Spatial Audio Canvas**

## Mission

Baue eine extrem einfach bedienbare, browserbasierte Begegnungsfläche, auf der Menschen ohne Kamera, ohne Registrierung, ohne Avatarsteuerung und ohne 3D-Welt miteinander sprechen können.

Der Kern ist nicht Kontemplation, nicht Rückzug und nicht eine virtuelle Landschaft. Der Kern ist **menschliche Begegnung durch räumlich unterscheidbare Stimmen**.

Nutzer:innen sitzen an anklickbaren Gesprächsinseln. Jede Person erscheint als einfacher Lichtpunkt. Wenn sie spricht, pulsiert oder leuchtet dieser Punkt entsprechend der Sprachlautstärke. Ihre Stimme wird so im Stereobild oder Spatial-Audio-Feld positioniert, dass man links, rechts, nah und weiter entfernt leicht unterscheiden kann.

## Nicht bauen

Dieses Projekt ist ausdrücklich nicht:

- kein weiteres Refugium
- keine 3D-Welt
- kein Metaverse
- keine Avatar-Plattform
- keine Videokonferenz mit Kamera-Kacheln
- kein Spiel
- keine App, die freie Bewegung, WASD oder Mausblick verlangt

## Bauen

Baue stattdessen:

- eine ruhige Weboberfläche
- Gesprächsinseln mit festen Sitzplätzen
- anklickbare Plätze
- räumlich unterscheidbare Stimmen
- pulsierende Sprecherpunkte
- dezente Hintergrundklänge als Immersion
- einfache Wechsel zwischen Gesprächsinseln
- Datenschutz durch Datenminimierung
- Barrierearmut als Grundprinzip

## Produktkern

Der erste Prototyp muss zeigen:

1. Nutzer:in kann per Link beitreten.
2. Nutzer:in gibt nur einen Namen oder ein Pseudonym ein.
3. Nutzer:in erlaubt das Mikrofon.
4. Nutzer:in sieht einen gedachten Tisch oder Gesprächskreis mit festen Plätzen.
5. Nutzer:in kann auf einen freien Platz klicken.
6. Andere Personen werden als einfache Punkte angezeigt.
7. Wenn jemand spricht, pulsiert oder leuchtet der Punkt dieser Person.
8. Stimmen links/rechts/gegenüber werden akustisch unterscheidbar.
9. Es gibt keine Kamera, keine Avatare, keine Registrierung und keine WASD-Steuerung.
10. Hintergrundklänge sind leise, optional und unterstützen nur die Atmosphäre.

## Leitprinzipien

### 1. Begegnung vor Atmosphäre

Hintergrundklänge dürfen Immersion und Imagination unterstützen, aber sie dürfen nie zum Hauptinhalt werden. Die wichtigste Audioquelle ist die menschliche Stimme.

### 2. Sitzplätze statt Bewegung

Nutzer:innen bewegen sich nicht frei. Sie nehmen Platz.

Erlaubte Aktionen:

- Platz nehmen
- Platz wechseln
- zu jemandem setzen
- Gesprächsinsel wechseln
- Mikrofon ein-/ausschalten

Nicht erlauben:

- WASD-Steuerung als Voraussetzung
- freie 3D-Kamera
- präzises Dragging als Hauptbedienung
- komplexe Avatarwahl

### 3. Gesprächsinseln statt Räume

Modelliere keine komplexen Räume. Modelliere soziale Situationen:

- runder Tisch
- Stuhlkreis
- Hörkreis
- Erzählcafé
- Konzertnähe
- Tisch am Fenster
- Kleingruppeninsel

Jede Gesprächsinsel hat eine begrenzte Zahl fester Plätze.

### 4. Links/rechts muss zusammenpassen

Wenn eine Person links vom eigenen Punkt angezeigt wird, soll ihre Stimme auch leicht links hörbar sein. Wenn eine Person rechts angezeigt wird, soll sie rechts hörbar sein.

Visuelle und akustische Orientierung müssen einander bestätigen.

### 5. Keine Avatare

Teilnehmende werden als einfache Punkte dargestellt:

- Kreis
- Lichtpunkt
- Initialen
- Anzeigename
- optional Farbe

Keine Körper, keine Gesichter, keine 3D-Modelle, keine schwebenden Figuren.

### 6. Kleine Gruppen

Pro Gesprächsinsel maximal 6 Personen im Standardfall. 8 nur als Ausnahme.

Bei mehr Teilnehmenden entstehen mehrere Inseln.

### 7. Datenschutz durch Minimierung

Verarbeite nur, was für das Live-Erlebnis nötig ist.

Nicht speichern:

- Audioaufnahmen
- dauerhafte Nutzerprofile
- echte Namen als Pflicht
- Kamera
- Trackingdaten
- unnötige Geräteinformationen

Temporär zulässig:

- Raum-ID
- Anzeigename
- Teilnehmer-ID
- aktuelle Gesprächsinsel
- aktueller Platz
- Mikrofonstatus
- Sprechpegel

## Technischer Realitätscheck

Eine lokale Demo kann vollständig im Browser laufen.

Echte Mehrpersonenkommunikation benötigt jedoch mindestens:

- Signalling zur Verbindung der Browser
- STUN für Peer-to-Peer-Verbindungsaufbau
- optional TURN, wenn direkte Verbindungen scheitern

Der erste Prototyp soll keinen eigenen Medienserver/SFU voraussetzen. WebRTC-Mesh reicht für kleine Gruppen. Baue die Architektur aber so, dass später ein SFU- oder Dienstanbieter ergänzt werden könnte, ohne die UI neu zu bauen.

## Empfohlene technische Architektur

### Frontend

- TypeScript
- Vite
- semantisches HTML
- CSS ohne unnötiges Framework
- Lit (leichtgewichtige Web Components, ~5 KB) als UI- und Plugin-UI-Schicht
- nanostores als schlankes, reaktives State-Management
- Web Audio API
- WebRTC Audio
- keine schwere 3D-Engine

### Audio

Bausteine:

- `AudioContext`
- `GainNode`
- `StereoPannerNode` für ersten Prototyp
- später optional `PannerNode` mit HRTF
- `AnalyserNode` für Sprachpegel
- `MediaStreamAudioSourceNode` für lokale und entfernte Streams

### Kommunikation

Für Phase 1 kann Mehrpersonenkommunikation simuliert werden.

Für echte Kommunikation:

- WebRTC Mesh
- Signalling über einfachen WebSocket-Dienst oder vorhandenen Anbieter
- STUN-Server
- TURN optional, aber für reale Tests einplanen

### Keine 3D-Abhängigkeit

Keine Three.js-, Babylon- oder A-Frame-Abhängigkeit für den Kernprototyp. Der Raum ist eine soziale Audiofläche, keine 3D-Szene.

## Datenmodell

### RoomConfig

```ts
export type RoomConfig = {
  id: string;
  title: string;
  description?: string;
  defaultIslandId: string;
  islands: ConversationIsland[];
  ambientSources?: AmbientSource[];
};
```

### ConversationIsland

```ts
export type ConversationIsland = {
  id: string;
  title: string;
  description?: string;
  type: "round_table" | "chair_circle" | "listening_window" | "cafe_table";
  maxParticipants: number;
  centerX: number;
  centerY: number;
  seats: Seat[];
  ambientSourceIds?: string[];
};
```

### Seat

```ts
export type Seat = {
  id: string;
  islandId: string;
  label: string;
  angleDeg: number;
  radius: number;
  x: number;
  z: number;
  occupiedBy?: string;
};
```

Hinweis: `x` beschreibt links/rechts, `z` beschreibt vorne/hinten. Für die UI können diese Koordinaten in 2D gerendert werden.

### Participant

```ts
export type Participant = {
  id: string;
  displayName: string;
  color: string;
  islandId: string;
  seatId: string;
  isLocal: boolean;
  isMuted: boolean;
  speakingLevel: number; // 0.0 bis 1.0
  isSpeaking: boolean;
};
```

### AmbientSource

```ts
export type AmbientSource = {
  id: string;
  title: string;
  kind: "ambience" | "music" | "podcast" | "signal";
  src: string;
  islandId?: string;
  seatId?: string;
  x?: number;
  z?: number;
  loop: boolean;
  defaultVolume: number;
  userControllable: boolean;
};
```

### RoomState

```ts
export type RoomState = {
  roomId: string;
  localParticipantId: string;
  participants: Record<string, Participant>;
  occupiedSeats: Record<string, string>; // seatId -> participantId
  activeAmbientSources: Record<string, boolean>;
};
```

## Audio-Logik

### Ziel

Die Audio-Engine muss aus Sitzpositionen hörbare Richtungen erzeugen.

### Minimalmodell für Phase 1

Nutze `StereoPannerNode`.

Berechne für jeden Remote-Teilnehmer einen Pan-Wert relativ zur lokalen Person:

- Person links: negativer Pan-Wert
- Person rechts: positiver Pan-Wert
- Person gegenüber: Pan nahe 0
- Person in anderer Insel: leiser oder stumm

Beispiel:

```ts
function computePan(relativeX: number): number {
  return Math.max(-0.65, Math.min(0.65, relativeX));
}
```

Zusätzlich pro Stimme einen `GainNode` nutzen:

```ts
function computeGain(distance: number, sameIsland: boolean): number {
  if (!sameIsland) return 0.08;
  return Math.max(0.25, 1 - distance * 0.25);
}
```

### Erweiterungsmodell für Phase 2

Nutze `PannerNode` mit HRTF.

- lokaler Listener sitzt am eigenen Seat
- Listener schaut zur Inselmitte
- Remote-Stimmen liegen an ihren Seat-Koordinaten
- Hintergrundquellen liegen an festen Koordinaten

Wichtig: Die UI muss dieselbe relative Orientierung zeigen, die Audio benutzt.

## Sprechaktivität

### Anforderungen

Für jede lokale und entfernte Stimme muss ein Sprachpegel berechnet werden.

- lokale Stimme: `getUserMedia` -> `AnalyserNode`
- entfernte Stimmen: Remote-MediaStream -> `AnalyserNode`

Der Pegel steuert:

- `isSpeaking`
- `speakingLevel`
- CSS-Pulsieren
- Helligkeit
- Lichtring

### Schwellenwerte

- sehr leise Geräusche ignorieren
- kurze Spitzen glätten
- Sprechzustand nicht flackern lassen

Verwende Glättung:

```ts
smoothedLevel = previous * 0.8 + current * 0.2;
```

Setze `isSpeaking = true`, wenn `smoothedLevel > threshold`.

## UI-Architektur

### Hauptansichten

1. JoinScreen
2. PermissionScreen
3. ConversationCanvas
4. IslandView
5. AudioControls
6. HelpPanel
7. PrivacyNotice

### JoinScreen

Muss enthalten:

- Projekt-/Raumname
- kurze Erklärung
- Namensfeld
- Button „Raum betreten“
- Datenschutzhinweis

### PermissionScreen

Muss enthalten:

- Erklärung, warum Mikrofon gebraucht wird
- Button „Mikrofon erlauben“
- Hinweis: Kamera wird nicht verwendet
- Hinweis: Kopfhörer empfohlen

### ConversationCanvas

Zeigt:

- aktuelle Gesprächsinsel
- Sitzplätze
- eigene Position
- andere Teilnehmende
- freie Plätze
- dezente Inselübersicht

### IslandView

Muss egozentrisch funktionieren:

- eigener Punkt unten oder zentral
- linke Personen links sichtbar
- rechte Personen rechts sichtbar
- gegenüberliegende Personen oben sichtbar

### ParticipantDot

Zustände:

- normal
- spricht
- stummgeschaltet
- entfernt/andere Insel
- lokal/eigener Punkt

### SeatButton

Zustände:

- frei
- besetzt
- eigener Platz
- fokussiert
- nicht verfügbar

Beschriftungen müssen Screenreader-tauglich sein:

- „Freier Platz links am Tisch. Aktivieren, um dort Platz zu nehmen.“
- „Karl sitzt links von dir und spricht gerade.“
- „Erna sitzt rechts von dir und ist stummgeschaltet.“

## Verzeichnisstruktur

```text
spatial-audio-canvas/
├── public/
│   ├── audio/
│   └── rooms/
│       └── demo-table.json
├── src/
│   ├── audio/
│   │   ├── AudioEngine.ts
│   │   ├── VoiceSpatializer.ts
│   │   ├── VoiceLevelAnalyser.ts
│   │   ├── AmbientSourcePlayer.ts
│   │   └── AudioRouting.ts
│   ├── rtc/
│   │   ├── SignalingClient.ts
│   │   ├── PeerConnectionManager.ts
│   │   ├── RemoteStreamRegistry.ts
│   │   └── PresenceSync.ts
│   ├── room/
│   │   ├── RoomConfigLoader.ts
│   │   ├── RoomState.ts
│   │   ├── SeatLayout.ts
│   │   ├── SeatingRules.ts
│   │   └── EgoPerspective.ts
│   ├── ui/
│   │   ├── App.ts
│   │   ├── JoinScreen.ts
│   │   ├── PermissionScreen.ts
│   │   ├── ConversationCanvas.ts
│   │   ├── IslandView.ts
│   │   ├── SeatButton.ts
│   │   ├── ParticipantDot.ts
│   │   ├── AudioControls.ts
│   │   └── HelpPanel.ts
│   ├── accessibility/
│   │   ├── Announcer.ts
│   │   └── FocusManagement.ts
│   ├── privacy/
│   │   └── PrivacyNotice.ts
│   └── main.ts
├── tests/
├── README.md
├── AGENTS.md
└── package.json
```

## Entwicklungsphasen und Tasks

## Phase 0 – Projektinitialisierung

### Ziel

Ein lauffähiges Frontend-Projekt mit einer statischen Gesprächsinsel.

### Tasks

- [ ] Vite + TypeScript Projekt erstellen.
- [ ] Semantisches HTML-Grundgerüst anlegen.
- [ ] CSS-Basis mit großen Buttons, hoher Lesbarkeit und responsivem Layout erstellen.
- [ ] Demo-Konfiguration `demo-table.json` anlegen.
- [ ] Einen runden Tisch mit sechs Plätzen rendern.
- [ ] Eigenen Platz visuell hervorheben.
- [ ] Freie und besetzte Plätze unterschiedlich darstellen.
- [ ] Tastaturfokus sichtbar machen.

### Akzeptanzkriterien

- App startet lokal.
- Ein Gesprächskreis mit sechs Plätzen ist sichtbar.
- Plätze sind per Maus, Touch und Tastatur auswählbar.
- Der eigene Platz wird eindeutig dargestellt.

## Phase 1 – Lokale Sitz- und Perspektivlogik

### Ziel

Die Anwendung soll ohne Audio zeigen, wie Menschen Plätze einnehmen und wie links/rechts aus eigener Perspektive dargestellt wird.

### Tasks

- [ ] `SeatLayout.ts` implementieren.
- [ ] Sitzplätze kreisförmig berechnen.
- [ ] `RoomState.ts` mit lokalen Dummy-Teilnehmenden erstellen.
- [ ] `EgoPerspective.ts` implementieren: Darstellung relativ zum eigenen Platz.
- [ ] Beispielpersonen links, rechts und gegenüber anzeigen.
- [ ] Wechsel des eigenen Platzes ermöglichen.
- [ ] UI nach Platzwechsel korrekt neu ausrichten.

### Akzeptanzkriterien

- Wenn der eigene Platz gewechselt wird, bleibt die Orientierung verständlich.
- Links sichtbare Personen werden als links markiert.
- Rechts sichtbare Personen werden als rechts markiert.
- Keine freie Bewegung ist möglich oder nötig.

## Phase 2 – Lokale Audio-Demo mit simulierten Stimmen

### Ziel

Links/rechts-Hören soll ohne WebRTC testbar sein.

### Tasks

- [ ] `AudioEngine.ts` erstellen.
- [ ] AudioContext erst nach Nutzerinteraktion starten.
- [ ] Beispiel-Audiodateien als simulierte Stimmen einbinden.
- [ ] Für jede simulierte Stimme `GainNode` und `StereoPannerNode` nutzen.
- [ ] Pan-Werte aus relativer Sitzposition berechnen.
- [ ] Lautstärke nach Nähe/Entfernung berechnen.
- [ ] Testbuttons „Karl spricht“, „Erna spricht“, „Maria spricht“ anlegen.
- [ ] Stimmen links/rechts/gegenüber hörbar unterscheiden.

### Akzeptanzkriterien

- Stimme links wird links hörbar.
- Stimme rechts wird rechts hörbar.
- Gegenüberliegende Stimme klingt mittiger.
- Wechsel des eigenen Platzes verändert die Hörperspektive plausibel.

## Phase 3 – Sprechpegel und pulsierende Punkte

### Ziel

Punkte sollen sichtbar auf Sprachlautstärke reagieren.

### Tasks

- [ ] `VoiceLevelAnalyser.ts` implementieren.
- [ ] Lokales Mikrofon mit `getUserMedia({ audio: true })` einbinden.
- [ ] `AnalyserNode` zur Pegelmessung nutzen.
- [ ] RMS- oder Durchschnittspegel berechnen.
- [ ] Pegel glätten, um Flackern zu vermeiden.
- [ ] `ParticipantDot` mit CSS-Variablen steuern.
- [ ] Punkt bei Sprache heller/leuchtender/größer machen.
- [ ] Option „Animation reduzieren“ berücksichtigen.

### Akzeptanzkriterien

- Eigener Punkt pulsiert beim Sprechen.
- Punkt reagiert nicht dauerhaft auf Hintergrundrauschen.
- Animation ist deutlich, aber nicht hektisch.
- Bei reduzierter Bewegung wird statt Pulsieren eine ruhigere Hervorhebung genutzt.

## Phase 4 – Hintergrundklänge als Immersion

### Ziel

Dezente Klänge sollen Gesprächsinseln atmosphärisch stützen, ohne Stimmen zu überdecken.

### Tasks

- [ ] `AmbientSourcePlayer.ts` erstellen.
- [ ] Pro Insel optionale Hintergrundquelle konfigurieren.
- [ ] Hintergrundklänge standardmäßig sehr leise einstellen.
- [ ] Lautstärkeregler für Ambiente einbauen.
- [ ] Button „Hintergrund aus“ anbieten.
- [ ] Audioquellen nur nach Nutzerinteraktion starten.
- [ ] Dokumentieren: Klänge sind unterstützend, nicht Hauptinhalt.

### Akzeptanzkriterien

- Hintergrundklang ist hörbar, aber nicht dominant.
- Nutzer:in kann Ambiente leiser stellen oder ausschalten.
- Stimmen bleiben immer verständlich.

## Phase 5 – Mehrere Gesprächsinseln

### Ziel

Eine größere Community soll aus mehreren kleinen Gesprächsrunden bestehen können.

### Tasks

- [ ] Raumkonfiguration auf mehrere `ConversationIsland`s erweitern.
- [ ] Übersicht mehrerer Inseln anzeigen.
- [ ] Inselwechsel per Klick ermöglichen.
- [ ] Freie Plätze in Zielinsel anzeigen.
- [ ] Option „automatisch freien Platz wählen“ implementieren.
- [ ] Teilnehmende anderer Inseln gedimmt darstellen.
- [ ] Audio anderer Inseln leiser oder stumm schalten.

### Akzeptanzkriterien

- Nutzer:in kann von Tisch A zu Tisch B wechseln.
- In jeder Insel sind maximal definierte Plätze belegbar.
- Die aktuelle Insel ist eindeutig erkennbar.
- Andere Inseln vermitteln Anwesenheit, überfordern aber nicht.

## Phase 6 – WebRTC-Mesh für echte Stimmen

### Ziel

Mehrere Browser sollen echte Audiospuren austauschen.

### Tasks

- [ ] `SignalingClient.ts` als austauschbare Schnittstelle definieren.
- [ ] Minimalen Signalling-Adapter implementieren oder vorhandenen Testdienst anbinden.
- [ ] `PeerConnectionManager.ts` implementieren.
- [ ] Lokalen Audiostream an Peers senden.
- [ ] Remote-Audiostreams empfangen und registrieren.
- [ ] Remote-Streams an `VoiceSpatializer` übergeben.
- [ ] Remote-Streams an `VoiceLevelAnalyser` übergeben.
- [ ] Presence-Daten synchronisieren: Name, Insel, Sitzplatz, Mute-Status.

### Akzeptanzkriterien

- Zwei Browser können sich hören.
- Drei bis vier Browser können in einer Insel sprechen.
- Punkte der Remote-Teilnehmenden pulsieren beim Sprechen.
- Positionen beeinflussen hörbare Richtung.
- Keine Kamera wird angefragt.

## Phase 7 – Sitzregeln und Konflikte

### Ziel

Gleichzeitige Platzwahl und Gruppenlogik müssen robust sein.

### Tasks

- [ ] `SeatingRules.ts` implementieren.
- [ ] Platz kann nur von einer Person belegt werden.
- [ ] Bei Konflikt alternative Plätze anbieten.
- [ ] Button „Zu Person setzen“ implementieren.
- [ ] Freien Nachbarplatz suchen.
- [ ] Wenn Insel voll ist, Hinweis anzeigen.
- [ ] Option „neue Gesprächsinsel öffnen“ konzeptionell vorbereiten.

### Akzeptanzkriterien

- Zwei Personen landen nicht dauerhaft auf demselben Platz.
- Nutzer:innen erhalten verständliche Rückmeldungen.
- „Zu Karl setzen“ führt zu einem freien Platz in Karls Insel oder zu einem klaren Hinweis.

## Phase 8 – Barrierearmut und Senior:innen-Test

### Ziel

Die Anwendung soll mit möglichst wenig Erklärung nutzbar sein.

### Tasks

- [ ] Alle interaktiven Elemente mit sinnvollen Labels versehen.
- [ ] Tastaturbedienung vollständig testen.
- [ ] Fokusreihenfolge prüfen.
- [ ] Screenreader-Ankündigungen für Platzwechsel und Sprecherstatus einbauen.
- [ ] Kontrast prüfen.
- [ ] Große Touch-Ziele sicherstellen.
- [ ] Hilfe-Panel in sehr einfacher Sprache schreiben.
- [ ] Testskript für Senior:innen oder wenig technikaffine Personen erstellen.

### Akzeptanzkriterien

- Raum kann ohne Maus nur mit Tastatur genutzt werden.
- Screenreader gibt verständliche Informationen.
- Nutzer:innen wissen jederzeit: Wo bin ich? Wer spricht? Ist mein Mikrofon an?

## Phase 9 – Datenschutz und Dokumentation

### Ziel

Datenschutzprinzipien müssen in UI, Code und README sichtbar werden.

### Tasks

- [ ] Datenschutzhinweis auf JoinScreen anzeigen.
- [ ] Keine Kamera-Berechtigung anfragen.
- [ ] Keine Tracking-Bibliotheken einbauen.
- [ ] Keine externen Fonts ohne Entscheidung verwenden.
- [ ] Keine Audioaufzeichnung implementieren.
- [ ] Temporäre Daten dokumentieren.
- [ ] README mit Datenschutzabschnitt aktualisieren.
- [ ] Technischen Realitätscheck zu Signalling/STUN/TURN dokumentieren.

### Akzeptanzkriterien

- Nutzer:innen verstehen vor Betreten, welche Daten nötig sind.
- Code fragt nur Mikrofon an.
- README erklärt ehrlich, welche Infrastruktur für echte Mehrpersonennutzung nötig ist.

## Phase 10 – Demo-Szenarien

### Ziel

Es sollen konkrete Räume als Beispiele entstehen.

### Tasks

- [ ] Demo 1: Ein runder Tisch mit sechs Plätzen.
- [ ] Demo 2: Zwei Café-Tische mit je vier Plätzen.
- [ ] Demo 3: Hörfenster mit Podcastquelle und Gesprächsplätzen.
- [ ] Demo 4: Bildungsszenario mit Plenum und Kleingruppen.
- [ ] Demo-Konfigurationen als JSON bereitstellen.

### Akzeptanzkriterien

- Jede Demo ist über eine eigene Raumkonfiguration startbar.
- Keine Demo benötigt 3D-Grafik.
- Jede Demo zeigt den Kern: Menschen hören einander räumlich und sehen, wer spricht.

## Qualitätskriterien

### Must-have

- keine Kamera
- keine Registrierung
- Name/Pseudonym reicht
- Mikrofon an/aus klar sichtbar
- feste Sitzplätze
- mindestens eine Gesprächsinsel
- links/rechts-Panning
- pulsierende Sprecherpunkte
- Tastaturbedienung
- hohe Lesbarkeit
- Datenschutzhinweis

### Should-have

- mehrere Gesprächsinseln
- Ambiente leiser/aus
- „Zu Person setzen“
- Screenreader-Ansagen
- reduzierte Animation
- Demo-Konfigurationen

### Could-have

- echtes HRTF-Spatial-Audio
- moderierter Plenumsmodus
- Gesprächszeit-Anzeige
- Podcast-Synchronisation
- temporäre Einladungslinks
- Moderationsrolle

### Won't-have im ersten Prototyp

- Video
- Chat als Hauptkommunikation
- Avatare
- 3D-Engine
- Nutzerkonten
- Recording
- komplexer Raumeditor
- freie Bewegung

## Testfragen

Nach jeder Entwicklungsphase prüfen:

1. Muss man eine Steuerung lernen?
2. Ist klar, wo ich sitze?
3. Ist klar, wer links/rechts von mir sitzt?
4. Ist hörbar, wer links/rechts spricht?
5. Ist sichtbar, wer gerade spricht?
6. Bleiben Stimmen wichtiger als Hintergrundklänge?
7. Ist das Mikrofon verständlich kontrollierbar?
8. Funktioniert die Bedienung ohne präzise Maus?
9. Werden unnötige Daten vermieden?
10. Fühlt es sich wie Begegnung an, nicht wie Technikdemo?

## Wichtigste Designentscheidung

Wenn eine Entscheidung zwischen visueller Komplexität und akustischer Klarheit nötig ist, wähle akustische Klarheit.

Wenn eine Entscheidung zwischen freier Bewegung und fester Sitzordnung nötig ist, wähle feste Sitzordnung.

Wenn eine Entscheidung zwischen Atmosphäre und Verständlichkeit der Stimmen nötig ist, wähle Verständlichkeit der Stimmen.

## Zielsatz

> Der Spatial Audio Canvas ermöglicht Begegnung durch hörbare Sitzordnung: Menschen nehmen an einfachen Gesprächsinseln Platz, hören Stimmen links, rechts, nah oder weiter entfernt und sehen an pulsierenden Lichtpunkten, wer spricht. Die Technik bleibt so unsichtbar wie möglich.


---

## Aktualisierung: Umsetzungsstand (erweiterbares Fundament)

Dieser Abschnitt haelt die in der Umsetzung getroffenen Anpassungen fest. Er praezisiert die obigen Vorgaben, ohne die Leitprinzipien zu aendern.

### Realisierter Stack

- **Lit** (leichtgewichtige Web Components) als UI- und Plugin-UI-Schicht.
- **nanostores** als schlankes, reaktives State-Management.
- Natives **Web Audio API** plus eigene **KlangNode-Abstraktion** (kein Tone.js im Kern).
- Natives **WebRTC** (Mesh) plus eigenes minimales **WebSocket-Signalling** (`server/signaling.mjs`).

### Erweiterbarkeit: Plugins, Registries, Klangnodes

- **Plugin-Manifest + PluginHost** (`src/core/`): Interaktionen registrieren sich selbst (Chat, Emotes, Klanggesten, Spiele).
- **UI-Regionen** (`sidebar`, `island-toolbar`, `overlay`): Plugins haengen Oberflaechen ein, ohne die Shell zu kennen.
- **KlangNodeRegistry**: neue Klang-Typen (z. B. Klanggesten) als Fabriken registrierbar.
- **MediaSourceRegistry**: neue Medientypen (Ambiente, Musik, Podcast, ...) registrierbar.
- **DataChannelBus + MessageEnvelope**: typisierte, kanalbasierte Nachrichten als Grundlage fuer Chat, Emotes, Spiele, Klanggesten und Presence.

### WebRTC vorgezogen

Anders als in der urspruenglichen Phasenreihenfolge ist die WebRTC-/Signalling-Schicht bereits Teil des Fundaments (austauschbar gehalten). Die lokale Audio-Demo (Phase 2) funktioniert weiterhin ohne Server.

### Datenmodell erweitert

Zusaetzlich zum Raum-Datenmodell gibt es Nachrichten-/Interaktionstypen: `MessageEnvelope`, `ChatMessagePayload`, `EmotePayload`, `SoundGesturePayload`, `GameMessagePayload`, `PresencePayload` (siehe `src/types/index.ts`).

### Erweiterte Verzeichnisstruktur

Ergaenzend zur obigen Struktur: `src/core/`, `src/media/`, `src/app/`, `src/styles/`, `src/plugins/{chat,emotes,sound-gestures,games}/`, `server/`, `docs/`, `.github/workflows/`.

### Deployment

GitHub Pages fuer das Frontend (`.github/workflows/deploy-pages.yml`), separater Signalling-Dienst (`docs/install-ws-service.md`).

### Raeumliches Modell: gemeinsame Weltkarte (statt Kanaele)

Die Gespraechsinseln liegen in einem gemeinsamen Koordinatenraum
(`src/room/WorldLayout.ts`) und werden als stabile Karte dargestellt
(`src/ui/WorldCanvas.ts`). Beim Platz-/Inselwechsel gleitet der eigene Avatar
ueber den Canvas (keine Tischdrehung). Pan/Gain jeder Stimme ergeben sich aus
der Bildschirmposition relativ zum eigenen Sitz - eine Formel fuer eigene und
benachbarte Inseln; andere Inseln werden allein durch Distanz leiser. Der
fruehere per-Insel-Egoblick (`EgoPerspective.ts`) bleibt als getestete Hilfsfunktion erhalten.