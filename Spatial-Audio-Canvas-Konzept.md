# Konzept: Spatial Audio Canvas als Begegnungsraum

## Arbeitstitel

**Spatial Audio Canvas – ein browserbasierter Begegnungsraum mit räumlichen Stimmen**

## Kurzfassung

Der Spatial Audio Canvas ist **kein weiteres Refugium**, kein meditativer Rückzugsraum und keine klassische 3D-Welt. Er ist eine einfache, browserbasierte Begegnungsfläche, auf der Menschen miteinander sprechen können, ohne Kamera, ohne Avatarsteuerung und ohne komplizierte Bedienung.

Die zentrale Erfahrung lautet:

> Ich bin mit anderen Menschen an einem gemeinsamen Ort. Ich höre, wer links, rechts, nah oder weiter entfernt von mir spricht. Ich sehe an pulsierenden Lichtpunkten, wer gerade spricht.

Hintergrundklänge wie Meer, Café, Garten, Kapelle oder Konzert dienen der **Immersion und Imagination**. Sie sind nicht der Hauptinhalt. Der Hauptinhalt ist die menschliche Stimme und die Begegnung zwischen Personen.

## Abgrenzung

### Nicht gemeint

Der Spatial Audio Canvas ist ausdrücklich nicht:

- ein weiteres digitales Refugium
- eine stille Einzel-Erfahrung
- eine virtuelle 3D-Welt mit WASD-Steuerung
- ein Videokonferenz-Ersatz mit Kamera-Kacheln
- ein Avatarraum mit Spiellogik
- ein Metaverse-Prototyp
- eine Plattform für visuelle Selbstdarstellung

### Gemeint

Der Spatial Audio Canvas ist:

- ein niedrigschwelliger Begegnungsraum
- ein Ort für Gespräche in kleinen Gruppen
- ein Hörfenster für Menschen, die nicht leicht aus dem Haus kommen
- eine Gesprächsfläche für Bildung, Seelsorge, Senior:innenarbeit, Gemeindearbeit und inklusive Gruppen
- eine einfache Web-App, die räumliches Hören und sichtbare Sprechaktivität verbindet

## Leitidee

Menschen sollen einander begegnen, miteinander sprechen und sich akustisch orientieren können. Die Anwendung stellt dafür keine frei begehbare Welt bereit, sondern **anklickbare Gesprächsinseln**.

Nutzer:innen bewegen sich nicht mit Tastatur oder Maus durch einen Raum. Sie nehmen an einem Ort Platz.

Beispiele:

- an einem gedachten Tisch
- in einem Hörkreis
- auf einem Stuhlkreis
- am Fenster
- in der Nähe eines Konzerts
- in einer kleinen Gesprächsgruppe am Meer
- in einem Erzählcafé

Die Nutzer:innen klicken auf einen freien Platz. Danach befinden sie sich akustisch an dieser Position.

## Grundprinzip: Gesprächsinseln statt freier Bewegung

Die wichtigste Designentscheidung lautet:

> Nicht Menschen laufen durch einen Raum, sondern Menschen nehmen an hörbaren Gesprächssituationen Platz.

Eine Gesprächsinsel ist eine kleine soziale Einheit mit festen Plätzen. Sie kann wie ein Kreis, ein Tisch, eine Bank oder ein Stuhlkreis gedacht sein.

Beispiel: Gesprächskreis mit sechs Plätzen

```text
             ○ Maria

      ○ Karl       ○ Erna

      ○ frei       ○ Heinz

             ◉ Ich
```

Oder als Tisch:

```text
             ○

       ○   [ Tisch ]   ○

       ○              ○

             ◉
```

Der eigene Punkt ist deutlich hervorgehoben. Andere Personen erscheinen als einfache Lichtpunkte mit Namen oder Initialen.

## Warum feste Plätze?

Feste Plätze lösen mehrere Probleme gleichzeitig:

1. **Einfache Bedienung**  
   Ein Klick genügt. Niemand muss laufen, drehen, zielen oder eine 3D-Kamera steuern.

2. **Soziale Verständlichkeit**  
   Menschen verstehen sofort: Ich sitze hier. Karl sitzt links. Erna sitzt rechts. Maria sitzt gegenüber.

3. **Akustische Orientierung**  
   Die Stimme von links kommt auch von links. Die Stimme von rechts kommt auch von rechts.

4. **Barriereärmere Nutzung**  
   Plätze können als große Buttons, Tastaturziele und Screenreader-Elemente umgesetzt werden.

5. **Begrenzte Gruppengröße**  
   Eine Gesprächsinsel bleibt übersichtlich. Bei mehr Menschen entstehen weitere Inseln.

## Empfohlene Gruppengröße

Für echte Gespräche sollten Gesprächsinseln bewusst klein bleiben.

| Personen pro Insel | Einschätzung |
|---|---|
| 2 | sehr gut für vertrauliche Gespräche |
| 3–4 | ideal für Unterscheidbarkeit und Beteiligung |
| 5–6 | noch gut nutzbar |
| 7–8 | nur mit klarer Moderation |
| mehr als 8 | besser auf mehrere Gesprächsinseln aufteilen |

Die Anwendung soll größere Gemeinschaft ermöglichen, aber nicht dadurch, dass alle in einem einzigen Gespräch sind. Stattdessen entstehen mehrere kleine Gesprächsinseln innerhalb eines gemeinsamen Ortes.

## Raumstruktur

Ein Raum besteht aus mehreren Gesprächsinseln und optionalen Klangquellen.

Beispiel:

```text
┌──────────────────────────────────────────────┐
│                                              │
│   Gespräch am Fenster      Hörkreis          │
│       ○ ○ ○ ○              ○ ○ ○ ○ ○         │
│                                              │
│                                              │
│   Konzertnähe             Erzählcafé         │
│       ○ ○ ○                ○ ○ ○ ○ ○ ○       │
│                                              │
└──────────────────────────────────────────────┘
```

Jede Insel hat:

- einen Namen
- eine kurze Beschreibung
- feste Plätze
- eine akustische Position
- optionale Hintergrundklänge
- optionale zentrale Audioquelle
- eine maximale Zahl von Teilnehmenden

## Sitzplätze als Kernobjekte

Nicht der Raum ist die wichtigste technische Einheit, sondern der Platz.

Ein Platz hat:

- eine eindeutige ID
- eine Position innerhalb der Gesprächsinsel
- eine akustische Koordinate
- einen sichtbaren Punkt auf der Oberfläche
- einen Belegungszustand: frei oder besetzt
- eine Orientierung zur Mitte der Insel

Beispiel:

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

Bei einem runden Tisch lassen sich die Plätze gleichmäßig auf einem Kreis verteilen.

```ts
const angle = (2 * Math.PI * index) / seatCount;
const x = Math.cos(angle) * radius;
const z = Math.sin(angle) * radius;
```

Die Mitte des Tisches oder Gesprächskreises liegt bei `x = 0`, `z = 0`.

## Eigene Hörperspektive

Entscheidend ist nicht nur, wo Personen objektiv sitzen, sondern wie sie aus meiner Perspektive hörbar sind.

Die Anwendung soll deshalb eine **egozentrische Gesprächsansicht** anbieten:

- Ich bin unten oder in der Mitte deutlich markiert.
- Links von mir wird links angezeigt.
- Rechts von mir wird rechts angezeigt.
- Gegenüber wird oben angezeigt.
- Der visuelle Eindruck passt zum akustischen Eindruck.

Das reduziert Verwirrung. Nutzer:innen müssen keine Karte im Kopf drehen.

Technisch kann es weiterhin globale Koordinaten geben. Für die Darstellung und das Audio werden sie aber relativ zur eigenen Sitzposition und Blickrichtung berechnet.

## Räumliches Stimmenmodell

Jede Stimme erhält eine Position relativ zur hörenden Person.

Beispiel:

- Karl sitzt links von mir.
- Karls Punkt erscheint links von meinem Punkt.
- Karls Stimme wird etwas stärker links gehört.
- Wenn Karl spricht, pulsiert sein Punkt links.

Erna sitzt rechts von mir.

- Ernas Punkt erscheint rechts.
- Ernas Stimme wird etwas stärker rechts gehört.
- Wenn Erna spricht, pulsiert ihr Punkt rechts.

Maria sitzt gegenüber.

- Marias Punkt erscheint oben.
- Ihre Stimme kommt eher aus der Mitte/vorne.

Die Seitigkeit muss nicht extrem sein. Sie soll nur helfen, Stimmen leicht zu unterscheiden.

## Audio-Panning

Für den Prototyp gibt es zwei mögliche Stufen.

### Stufe 1: Einfaches Stereo-Panning

Für jeden Remote-Audiostream wird ein `StereoPannerNode` verwendet.

- links sitzende Person: Pan-Wert z. B. `-0.45`
- rechts sitzende Person: Pan-Wert z. B. `0.45`
- gegenüber: Pan-Wert z. B. `0`
- weiter entfernte Insel: zusätzlich leiser

Vorteil:

- sehr einfach
- gut testbar
- funktioniert in vielen Browsern verlässlich

Nachteil:

- weniger natürlich als echtes HRTF-Spatial-Audio

### Stufe 2: Web Audio PannerNode / HRTF

Für realistischeres räumliches Hören wird ein `PannerNode` genutzt.

- Stimmen bekommen echte Koordinaten.
- Die hörende Person hat eine Listener-Position und Orientierung.
- Entfernung und Richtung beeinflussen Lautstärke und Richtung.

Vorteil:

- natürlicheres Raumgefühl
- Nähe und Distanz werden besser erlebbar

Nachteil:

- komplexer
- benötigt gutes Tuning
- mit Kopfhörern deutlich besser als über Lautsprecher

## Sichtbare Sprecheraktivität

Jede Person wird durch einen einfachen Punkt dargestellt.

```text
● Erna
● Karl
● Maria
```

Beim Sprechen reagiert der Punkt:

- er pulsiert
- er wird heller
- er bekommt einen Lichtring
- optional wird der Name kurz hervorgehoben

Wichtig: Die Animation zeigt nicht nur „Mikrofon ist aktiv“, sondern orientiert sich an der tatsächlichen Sprachlautstärke.

Technisch geschieht das über einen Audio-Level-Wert pro Person.

```ts
export type SpeakingState = {
  participantId: string;
  level: number; // 0.0 bis 1.0
  isSpeaking: boolean;
};
```

Der visuelle Punkt kann dann so reagieren:

```css
.participant-dot[data-speaking="true"] {
  transform: scale(var(--pulse-scale));
  box-shadow: 0 0 var(--glow-size) currentColor;
  opacity: 1;
}
```

## Wichtig: visuelles und akustisches Feedback gehören zusammen

Der zentrale Erfahrungswert entsteht aus der Verbindung:

| Wahrnehmung | Bedeutung |
|---|---|
| Punkt links pulsiert | Diese Person links spricht gerade |
| Stimme kommt von links | Die hörbare Richtung passt zum Punkt |
| Punkt wird heller | Die Person spricht lauter oder deutlicher |
| Punkt ist ruhig | Person ist anwesend, spricht aber nicht |
| Punkt ist gedimmt | Person ist weiter weg oder in anderer Insel |

Dadurch entsteht Orientierung ohne Video.

## Hintergrundklänge

Hintergrundklänge sind erlaubt, aber sie müssen funktional verstanden werden.

Sie dienen:

- der Atmosphäre
- der Imagination
- der sozialen Einbettung
- der leichten Orientierung zwischen Gesprächsinseln
- der emotionalen Färbung eines Ortes

Sie dürfen nicht:

- Gespräche überdecken
- wichtiger werden als Stimmen
- dauerhaft anstrengend sein
- Menschen mit Hörproblemen irritieren
- als meditativer Hauptinhalt verstanden werden

Jeder Hintergrundklang muss steuerbar sein:

- leiser
- aus
- nur lokal
- nur beim Eintritt
- optional mit Untertitel/Beschreibung

## Klangquellen als soziale Anlässe

Neben Hintergrundklängen kann es zentrale Audioquellen geben, die Gesprächsanlässe schaffen.

Beispiele:

- ein Podcast am Hörfenster
- ein Musikstück in der Konzertnähe
- ein Zeitzeug:innen-Interview im Geschichtsraum
- ein Gedicht im Literaturkreis
- eine Klangcollage im Religionsunterricht
- ein Impuls im Erzählcafé

Diese Audioquellen sind keine reinen Dekorationen. Sie eröffnen Gespräche.

Beispiel:

> Eine Gruppe hört gemeinsam einen Podcast. Wer näher an der Quelle sitzt, hört ihn deutlicher. Wer sich etwas abseits an einen Tisch setzt, kann leiser darüber sprechen.

## Interaktionsmodell

Die Bedienung soll aus wenigen klaren Handlungen bestehen.

### Raum betreten

1. Link öffnen.
2. Namen oder Pseudonym eingeben.
3. Mikrofon erlauben.
4. Kopfhörerhinweis lesen.
5. Platz auswählen oder automatisch Platz erhalten.

### Platz nehmen

Nutzer:in klickt auf einen freien Sitzplatz.

Beschriftung:

- „Hier Platz nehmen“
- „Freier Platz am Tisch“
- „Freier Platz links“
- „Freier Platz im Hörkreis“

### Zu jemandem setzen

Nutzer:in klickt auf eine Person oder auf eine Schaltfläche:

- „Zu Karl setzen“
- „Zu Erna an den Tisch“
- „Freien Platz in dieser Runde wählen“

Das System sucht einen freien Nachbarplatz oder zeigt passende Plätze an.

### Insel wechseln

Nutzer:in klickt auf eine andere Gesprächsinsel:

- „Zum Erzählcafé“
- „Zum Hörkreis“
- „Zur Konzertnähe“
- „Zum Tisch am Fenster“

Dann wird entweder automatisch ein freier Platz gewählt oder die freien Plätze werden angezeigt.

### Mikrofon steuern

Die Mikrofonsteuerung muss jederzeit klar sichtbar sein.

- „Mikrofon an“
- „Mikrofon aus“
- „Ich spreche gerade“
- „Andere hören mich“

Für unsichere Nutzer:innen ist ein großer, eindeutiger Mikrofonbutton wichtiger als viele Zusatzfunktionen.

## Raumtypen

### 1. Runder Tisch

Gut für:

- Kleingruppengespräche
- Senior:innenrunden
- Unterrichtsgespräche
- Seelsorgegruppen
- Lesekreise

Eigenschaften:

- 4 bis 6 Plätze
- Stimmen gut unterscheidbar
- einfache Sitzordnung
- keine dominante Richtung

### 2. Stuhlkreis

Gut für:

- moderierte Runden
- Reflexion
- Religionsunterricht
- Gespräch über Impulse
- Feedbackrunden

Eigenschaften:

- stärker gemeinschaftlich
- Moderator:in kann besonderen Platz haben
- gut für „jede:r kommt einmal dran“

### 3. Hörfenster

Gut für:

- gemeinsames Podcast-Hören
- Musikimpulse
- Audioführung
- Erzählcafé
- Erinnerungsarbeit

Eigenschaften:

- zentrale Audioquelle
- Sitzplätze in Nähe oder Distanz
- Gespräche können um die Quelle herum entstehen

### 4. Café-Tische

Gut für:

- große Gruppen mit kleinen Gesprächsinseln
- offene Begegnung
- Pausenräume
- Community-Treffen

Eigenschaften:

- mehrere kleine Tische
- Menschen können Tisch wechseln
- Atmosphäre durch leisen Café-Klang

### 5. Moderierter Bildungsraum

Gut für:

- Unterricht
- Fortbildung
- Workshop
- Gruppenarbeit

Eigenschaften:

- mehrere Gesprächsinseln
- zentraler Impuls
- Lehrkraft/Moderation kann Gruppen besuchen
- optionale Rückkehr in Plenum

## Datenschutz und Infrastruktur

### Grundsatz

Die Anwendung soll mit minimaler Datenerhebung und minimaler Infrastruktur funktionieren.

Pflichtprinzipien:

- keine Kamera
- keine Aufzeichnung
- keine Registrierung
- keine dauerhaften Profile
- frei wählbare Namen
- temporäre Raum-IDs
- flüchtige Presence-Daten
- keine Tracking- oder Marketingdienste

### Technischer Realitätscheck

Eine rein lokale Demo kann vollständig im Browser laufen. Echte Mehrpersonenkommunikation benötigt jedoch mindestens eine Form von Verbindungskoordination.

Für WebRTC sind typischerweise nötig:

- Signalling, um Teilnehmende miteinander zu verbinden
- STUN, um direkte Verbindungen zu ermöglichen
- optional TURN, wenn direkte Verbindungen scheitern

Der erste Prototyp soll **keinen eigenen Medienserver** und keine SFU voraussetzen. Für kleine Gruppen kann WebRTC-Mesh ausreichen. Langfristig muss geprüft werden, ob eine datenschutzkonforme, kostengünstige Infrastruktur oder ein bestehender vertrauenswürdiger Dienst genutzt wird.

## Barrierearmut

Die Anwendung soll besonders für Menschen geeignet sein, die nicht technikaffin sind oder Einschränkungen haben.

Mindestanforderungen:

- große Klickflächen
- klare Beschriftungen
- keine WASD-Steuerung
- keine Kameradrehung
- keine Drag-and-Drop-Pflicht
- Tastaturbedienbarkeit
- Screenreader-kompatible Rollen und Labels
- sichtbarer Fokus
- klare Zustände: „Du bist hier“, „Karl spricht“, „Mikrofon aus“
- kontrastreiche Darstellung
- reduzierte Animationen als Option
- Lautstärkeregler für Hintergrundklänge
- Kopfhörerhinweis
- einfache Hilfe: „Was muss ich tun?“

## Minimaler Prototyp

Der erste sinnvolle Prototyp sollte nicht mehrere Räume bauen, sondern nur den Kern beweisen.

### Prototyp A: Ein Tisch, sechs Plätze

Funktionen:

- Startseite mit Namenseingabe
- Mikrofonfreigabe
- ein runder Tisch mit sechs anklickbaren Plätzen
- eigener Punkt
- andere simulierte oder echte Punkte
- Sprecherpunkte pulsieren bei Sprachaktivität
- Stimmen werden links/rechts gepannt
- dezenter Hintergrundklang ist optional zuschaltbar

Ziel:

> Beweist, dass Menschen ohne Avatar und ohne 3D-Steuerung räumlich unterscheidbar miteinander sprechen können.

### Prototyp B: Zwei Gesprächsinseln

Erweiterung:

- zwei Tische oder Gesprächsinseln
- Wechsel per Klick
- Personen anderer Inseln sind gedimmt/leiser oder nicht hörbar
- Hintergrundklang unterscheidet die Inseln leicht

Ziel:

> Beweist, dass eine größere Gemeinschaft aus mehreren kleinen Gesprächsrunden entstehen kann.

### Prototyp C: Hörfenster mit Audioquelle

Erweiterung:

- zentrale Audioquelle, z. B. Podcast oder Musikstück
- Plätze näher oder weiter entfernt von der Quelle
- Menschen können zuhören oder sich an den Rand setzen und sprechen

Ziel:

> Beweist, dass gemeinsames Hören und Gespräch kombiniert werden können.

## Erfolgskriterien

Der Prototyp ist erfolgreich, wenn Testpersonen sagen können:

- „Ich wusste, wo ich bin.“
- „Ich konnte erkennen, wer spricht.“
- „Ich konnte links und rechts einigermaßen unterscheiden.“
- „Ich musste keine Steuerung lernen.“
- „Ich hatte nicht das Gefühl, in einer Videokonferenz zu sein.“
- „Ich hatte das Gefühl, mit Menschen an einem gemeinsamen Ort zu sein.“

## Zentrale Formulierung für die weitere Entwicklung

> Der Spatial Audio Canvas ist ein browserbasierter Begegnungsraum. Menschen nehmen an anklickbaren Gesprächsinseln Platz. Jeder Platz besitzt eine hörbare Position. Stimmen werden räumlich unterscheidbar und sprechende Personen als pulsierende Lichtpunkte sichtbar. Hintergrundklänge dienen der Atmosphäre und Imagination, nicht als Hauptinhalt. Der Kern ist die Begegnung zwischen Menschen.
