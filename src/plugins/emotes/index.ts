import type { SacPlugin } from '../../core/PluginManifest';
import type { EmotePayload } from '../../types';
import { $participants } from '../../core/Store';
import { DEFAULT_EMOTES, EmoteBar } from './emote-bar';

export function createEmotesPlugin(): SacPlugin {
  const bar = new EmoteBar();
  return {
    manifest: {
      id: 'emotes',
      title: 'Emotes',
      version: '0.1.0',
      description: 'Kurze, sichtbare Gesten ohne Worte.',
      capabilities: ['message', 'ui'],
    },
    setup(ctx) {
      bar.onEmote = (emote) => ctx.sendMessage('emote', 'show', { emote } satisfies EmotePayload);
      ctx.bus.on('message:received', (envelope) => {
        if (envelope.channel !== 'emote') {
          return;
        }
        const payload = envelope.payload as EmotePayload;
        // 'wave' (Winken) ist raumuebergreifend; alle anderen Emotes nur in der eigenen Insel.
        if (
          payload.emote !== 'wave' &&
          envelope.islandId &&
          envelope.islandId !== ctx.localIslandId()
        ) {
          return;
        }
        const def = DEFAULT_EMOTES.find((e) => e.id === payload.emote);
        const name = $participants.get()[envelope.senderId]?.displayName ?? 'Jemand';
        const label = def ? def.label : payload.emote;
        bar.flash(`${name}: ${label}`);
        ctx.announcer.announce(`${name} sendet ${label}.`);
      });
      ctx.ui.mount('island-toolbar', { pluginId: 'emotes', element: bar, order: 20 });
    },
  };
}