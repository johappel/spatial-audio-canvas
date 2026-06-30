// Bildet typisierte Nachrichten auf die WebRTC-DataChannels ab und spiegelt
// sie in den App-EventBus. Chat, Emotes, Games und Klanggesten nutzen diesen
// Bus, ohne WebRTC direkt zu kennen.
import type { AppEventBus } from '../core/events';
import type { MessageChannel, MessageEnvelope } from '../types';
import type { PeerConnectionManager } from './PeerConnectionManager';

export class DataChannelBus {
  constructor(
    private readonly peers: PeerConnectionManager,
    private readonly bus: AppEventBus,
    private readonly localId: string,
  ) {}

  init(): void {
    this.bus.on('message:send', (envelope) => this.broadcast(envelope));
  }

  // Von PeerConnectionManager bei eingehenden Daten aufgerufen.
  handleIncoming(raw: string): void {
    try {
      const envelope = JSON.parse(raw) as MessageEnvelope;
      this.bus.emit('message:received', envelope);
    } catch (error) {
      console.warn('[DataChannelBus] Ungueltige Nachricht', error);
    }
  }

  send(channel: MessageChannel, type: string, payload: unknown): void {
    const envelope: MessageEnvelope = {
      channel,
      type,
      senderId: this.localId,
      sentAt: Date.now(),
      payload,
    };
    this.broadcast(envelope);
    // Lokale Spiegelung, damit die eigene UI die eigene Aktion sofort zeigt.
    this.bus.emit('message:received', envelope);
  }

  // Sendet einen bereits vollstaendig aufgebauten Umschlag (inkl. islandId)
  // und spiegelt ihn lokal.
  sendEnvelope(envelope: MessageEnvelope): void {
    this.broadcast(envelope);
    this.bus.emit('message:received', envelope);
  }

  private broadcast(envelope: MessageEnvelope): void {
    this.peers.broadcast(JSON.stringify(envelope));
  }
}