// Plugin: gemeinsames Video schauen mit synchronisierter Wiedergabe.
// Synchronisiert Laden/Play/Pause ueber den 'watch'-Kanal - insel-gebunden,
// damit jede Gespraechsinsel ihr eigenes Video hat.
import type { SacPlugin } from '../../core/PluginManifest';
import type { WatchPayload } from '../../types';
import { $currentIslandId } from '../../core/Store';
import { WatchPanel } from './watch-panel';

export function createWatchPlugin(): SacPlugin {
  const panel = new WatchPanel();
  return {
    manifest: {
      id: 'watch',
      title: 'Gemeinsam schauen',
      version: '0.1.0',
      description: 'Ein gemeinsam gesteuertes YouTube-Video je Insel.',
      capabilities: ['message', 'ui'],
    },
    setup(ctx) {
      panel.onLoad = (videoId) => ctx.sendMessage('watch', 'load', { videoId } satisfies WatchPayload);
      panel.onPlay = (time) => ctx.sendMessage('watch', 'play', { time } satisfies WatchPayload);
      panel.onPause = (time) => ctx.sendMessage('watch', 'pause', { time } satisfies WatchPayload);

      ctx.bus.on('message:received', (envelope) => {
        if (envelope.channel !== 'watch') {
          return;
        }
        // Eigene Aktionen nicht doppelt anwenden (lokaler Player ist schon dort).
        if (envelope.senderId === ctx.localParticipantId()) {
          return;
        }
        // Nur Ereignisse aus der eigenen Insel anwenden.
        if (envelope.islandId && envelope.islandId !== ctx.localIslandId()) {
          return;
        }
        const payload = envelope.payload as WatchPayload;
        if (envelope.type === 'load' && payload.videoId) {
          void panel.applyLoad(payload.videoId);
        } else if (envelope.type === 'play') {
          void panel.applyPlay(payload.time ?? 0);
        } else if (envelope.type === 'pause') {
          void panel.applyPause(payload.time ?? 0);
        } else if (envelope.type === 'request') {
          // Spaet Beigetretene fragen den Stand ab - falls ein Video laeuft, antworten.
          const state = panel.getState();
          if (state) {
            ctx.sendMessage('watch', 'state', state satisfies WatchPayload);
          }
        } else if (envelope.type === 'state' && payload.videoId) {
          void panel.applyState({
            videoId: payload.videoId,
            time: payload.time ?? 0,
            playing: payload.playing ?? false,
          });
        }
      });

      // Verbindet sich ein neuer Peer, den aktuellen Video-Stand der Insel anfragen.
      ctx.bus.on('datachannel:open', () => {
        ctx.sendMessage('watch', 'request', {} satisfies WatchPayload);
      });

      // Inselwechsel: laufendes Video stoppen/leeren und den Stand der NEUEN
      // Insel anfragen (jede Insel hat ihr eigenes Video).
      let currentIsland = ctx.localIslandId();
      $currentIslandId.listen((islandId) => {
        if (islandId === currentIsland) {
          return;
        }
        currentIsland = islandId;
        panel.clear();
        ctx.sendMessage('watch', 'request', {} satisfies WatchPayload);
      });

      ctx.ui.mount('sidebar', {
        pluginId: 'watch',
        element: panel,
        order: 30,
        title: 'Gemeinsam schauen',
        icon: '🎬',
      });
    },
  };
}
