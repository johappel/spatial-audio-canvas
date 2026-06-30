// App-weite Event-Definitionen.
import type { EventBus } from './EventBus';
import type { UiRegion } from './UiRegions';
import type { MessageEnvelope, Participant } from '../types';

export type AppEvents = {
  'message:received': MessageEnvelope;
  'message:send': MessageEnvelope;
  'participant:joined': Participant;
  'participant:updated': Participant;
  'participant:left': { id: string };
  'seat:changed': { participantId: string; seatId: string };
  'audio:unlocked': { ok: true };
  'ui:regions-changed': { region: UiRegion };
  'datachannel:open': { peerId: string };
};

export type AppEventBus = EventBus<AppEvents>;