import type { SacPlugin } from '../../core/PluginManifest';
import type { ChatMessagePayload } from '../../types';
import { $participants } from '../../core/Store';
import { ChatPanel } from './chat-panel';

export function createChatPlugin(): SacPlugin {
  const panel = new ChatPanel();
  return {
    manifest: {
      id: 'chat',
      title: 'Chat',
      version: '0.1.0',
      description: 'Textnachrichten in der Gespraechsinsel.',
      capabilities: ['message', 'ui'],
    },
    setup(ctx) {
      panel.onSend = (text, scope) =>
        ctx.sendMessage('chat', 'message', { text, scope } satisfies ChatMessagePayload);
      ctx.bus.on('message:received', (envelope) => {
        if (envelope.channel !== 'chat') {
          return;
        }
        const payload = envelope.payload as ChatMessagePayload;
        const isGlobal = payload.scope === 'global';
        // Raum-Chat nur in der eigenen Insel anzeigen; globaler Chat ueberall.
        if (!isGlobal && envelope.islandId && envelope.islandId !== ctx.localIslandId()) {
          return;
        }
        const senderName = $participants.get()[envelope.senderId]?.displayName ?? 'Jemand';
        panel.addMessage({
          senderId: envelope.senderId,
          senderName,
          text: payload.text,
          sentAt: envelope.sentAt,
          scope: isGlobal ? 'global' : 'island',
        });
      });
      ctx.ui.mount('sidebar', { pluginId: 'chat', element: panel, order: 10 });
    },
  };
}