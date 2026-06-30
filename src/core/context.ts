// Der AppContext ist die Dependency-Oberflaeche, die Plugins erhalten.
// Er buendelt Kerndienste, ohne dass Plugins deren Implementierung kennen.
import type { AppEventBus } from './events';
import type { UiRegionRegistry } from './UiRegions';
import type { AudioEngine } from '../audio/AudioEngine';
import type { KlangNodeRegistry } from '../audio/KlangNodeRegistry';
import type { MediaSourceRegistry } from '../media/MediaSourceRegistry';
import type { Announcer } from '../accessibility/Announcer';
import type { MessageChannel } from '../types';

export interface AppContext {
  bus: AppEventBus;
  audio: AudioEngine;
  klangNodes: KlangNodeRegistry;
  media: MediaSourceRegistry;
  announcer: Announcer;
  ui: UiRegionRegistry;
  sendMessage(channel: MessageChannel, type: string, payload: unknown): void;
  localParticipantId(): string;
}