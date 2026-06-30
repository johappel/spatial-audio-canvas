# Signalling-Dienst einrichten

Der **Frontend-Teil** (diese App) laeuft vollstaendig statisch, z. B. auf GitHub
Pages. Fuer **echte Mehrpersonen-Gespraeche** ueber WebRTC wird zusaetzlich ein
kleiner **Signalling-Dienst** benoetigt. Er vermittelt nur den Verbindungsaufbau
zwischen den Browsern. Es laufen **keine Audiodaten** ueber diesen Server – die
Stimmen werden direkt zwischen den Browsern (Peer-to-Peer) uebertragen.

## Was wofuer noetig ist

| Baustein   | Zweck                                   | Auf GitHub Pages? |
| ---------- | --------------------------------------- | ----------------- |
| Frontend   | die App selbst                          | ja                |
| Signalling | Verbindungsaufbau (WebSocket)           | nein, extern      |
| STUN       | NAT-Durchstossung                       | oeffentlich nutzbar |
| TURN       | Fallback, wenn P2P scheitert (optional) | nein, extern      |

## 1. Lokal testen (mehrere Tabs)

```bash
npm install
npm run signaling      # startet ws://localhost:8787
npm run dev            # startet das Frontend auf http://localhost:5173
```

Lege eine `.env` an (Vorlage: `.env.example`):

```
VITE_SIGNALING_URL=ws://localhost:8787
VITE_STUN_URLS=stun:stun.l.google.com:19302
```

Oeffne die Dev-URL in zwei Browser-Tabs, tritt in beiden bei und erlaube das
Mikrofon. Die Tabs sollten sich hoeren und die Punkte beim Sprechen pulsieren.

## 2. Signalling-Dienst hosten

Der Server liegt in `server/signaling.mjs` und braucht nur Node und das Paket
`ws`. Er kann unveraendert deployt werden. Der Port wird ueber die
Umgebungsvariable `PORT` gesetzt.

### Beispiel: Fly.io / Render / Railway / eigener VPS

1. Repository (oder nur `server/` + `package.json`) auf den Host bringen.
2. Startbefehl setzen:
   ```bash
   node server/signaling.mjs
   ```
3. Sicherstellen, dass der Dienst per **`wss://`** (TLS) erreichbar ist. Browser
   erlauben aus einer HTTPS-Seite (z. B. GitHub Pages) nur sichere WebSockets.
   Die meisten Plattformen stellen TLS automatisch bereit.
4. Die oeffentliche URL (z. B. `wss://dein-host.example`) notieren.

### Beispiel: Cloudflare Workers / Durable Objects

Alternativ laesst sich ein serverloses WebSocket-Signalling mit Durable Objects
betreiben. Die `SignalingClient`-Schnittstelle bleibt gleich; nur die URL aendert
sich.

## 3. Frontend auf den Dienst zeigen lassen

Setze beim Build die Umgebungsvariable, damit das Frontend den richtigen Endpoint
nutzt:

```
VITE_SIGNALING_URL=wss://dein-host.example
```

Auf GitHub Pages: trage die Variable im Deploy-Workflow oder als Repository-Secret
ein und reiche sie beim `npm run build` durch (analog zu `GITHUB_PAGES`).

## 4. TURN (optional, fuer schwierige Netze)

Wenn direkte P2P-Verbindungen scheitern (strenge Firewalls/NAT), wird ein
TURN-Server als Relais gebraucht. Konfiguriere ihn ueber:

```
VITE_TURN_URL=turns:dein-turn-host.example:5349
VITE_TURN_USERNAME=...
VITE_TURN_CREDENTIAL=...
```

Ein eigener TURN-Server (z. B. coturn) oder ein gehosteter Anbieter ist dafuer
noetig. Fuer erste Tests im selben Netzwerk reicht meist STUN.

## Datenschutzhinweis

- Der Signalling-Server sollte unter eigener Kontrolle stehen (DSGVO).
- Es werden keine Audiodaten und keine Inhalte ueber den Server geleitet, nur
  technische Verbindungsdaten (SDP/ICE) waehrend des Verbindungsaufbaus.
- Vermeide fremde Cloud-Broker, wenn die Zielgruppe (z. B. Seelsorge, Bildung)
  besonders schutzbeduerftig ist.