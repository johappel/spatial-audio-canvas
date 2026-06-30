// Synchronisiert Anwesenheitsdaten (Name, Insel, Platz, Mute) ueber den Bus.
import type { AppEventBus } from '../core/events';
import type { MessageEnvelope, Participant, PresencePayload } from '../types';
import { removeParticipant, upsertParticipant } from '../core/Store';

export class PresenceSync {
  constructor(
    private readonly bus: AppEventBus,
    private readonly localId: string,
  ) {}

  init(): void {
    this.bus.on('message:received', (envelope: MessageEnvelope) => {
      if (envelope.channel !== 'presence') {
        return;
      }
      if (envelope.senderId === this.localId) {
        return;
      }
      if (envelope.type === 'leave') {
        removeParticipant(envelope.senderId);
        return;
      }
      const payload = envelope.payload as PresencePayload;
      upsertParticipant({ ...payload.participant, isLocal: false });
    });
  }

  announceLocal(participant: Participant): void {
    const { isLocal: _isLocal, ...rest } = participant;
    const payload: PresencePayload = { participant: rest };
    this.bus.emit('message:send', {
      channel: 'presence',
      type: 'state',
      senderId: this.localId,
      sentAt: Date.now(),
      payload,
    });
  }

  announceLeave(): void {
    this.bus.emit('message:send', {
      channel: 'presence',
      type: 'leave',
      senderId: this.localId,
      sentAt: Date.now(),
      payload: {},
    });
  }
}