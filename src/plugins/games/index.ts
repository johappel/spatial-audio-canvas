// Mini-Game-Host: ein erweiterbarer Vertrag plus ein Beispielspiel.
// Weitere Spiele lassen sich registrieren, ohne den Kern zu aendern.
import type { SacPlugin } from '../../core/PluginManifest';
import type { GameMessagePayload } from '../../types';
import { $participants } from '../../core/Store';
import { GamesPanel } from './games-panel';

export interface MiniGame {
  id: string;
  title: string;
  // Liefert die Start-Aktion, die an alle gesendet wird.
  start(): GameMessagePayload;
  // Verarbeitet eine eingehende Aktion und gibt optional einen Anzeigetext zurueck.
  handle(action: string, data: unknown): string | null;
}

const QUESTIONS = [
  'Was hat dich heute zum Laecheln gebracht?',
  'Welcher Klang erinnert dich an Zuhause?',
  'Wofuer bist du gerade dankbar?',
  'Welcher Ort beruhigt dich?',
  'Worauf freust du dich diese Woche?',
];

const impulsfrage: MiniGame = {
  id: 'impulsfrage',
  title: 'Impulsfrage',
  start() {
    const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    return { gameId: 'impulsfrage', action: 'prompt', data: { question } };
  },
  handle(action, data) {
    if (action === 'prompt') {
      return (data as { question: string }).question;
    }
    return null;
  },
};

export function createGamesPlugin(): SacPlugin {
  const panel = new GamesPanel();
  const games = new Map<string, MiniGame>();
  games.set(impulsfrage.id, impulsfrage);

  return {
    manifest: {
      id: 'games',
      title: 'Spiele',
      version: '0.1.0',
      description: 'Leichte gemeinsame Impulse und Mini-Spiele.',
      capabilities: ['message', 'ui'],
    },
    setup(ctx) {
      panel.games = [...games.values()].map((game) => ({ id: game.id, title: game.title }));
      panel.onStart = (gameId) => {
        const game = games.get(gameId);
        if (!game) {
          return;
        }
        const payload = game.start();
        ctx.sendMessage('game', payload.action, payload);
      };

      ctx.bus.on('message:received', (envelope) => {
        if (envelope.channel !== 'game') {
          return;
        }
        // Spiele wirken nur in der eigenen Insel.
        if (envelope.islandId && envelope.islandId !== ctx.localIslandId()) {
          return;
        }
        const payload = envelope.payload as GameMessagePayload;
        const game = games.get(payload.gameId);
        const text = game?.handle(envelope.type, payload.data) ?? null;
        if (text) {
          panel.showPrompt(text);
          const name = $participants.get()[envelope.senderId]?.displayName ?? 'Jemand';
          ctx.announcer.announce(`${name} startet ${game?.title ?? 'ein Spiel'}: ${text}`);
        }
      });

      ctx.ui.mount('sidebar', {
        pluginId: 'games',
        element: panel,
        order: 20,
        title: 'Spiele',
        icon: '🎲',
      });
    },
  };
}