// Haelt die Audio-Routen der Remote-Stimmen, damit sie raeumlich positioniert
// und beim Verlassen wieder aufgeraeumt werden koennen.
import type { VoiceRoute } from '../audio/AudioRouting';

export interface RemoteVoice {
  stream: MediaStream;
  route: VoiceRoute;
}

export class RemoteStreamRegistry {
  private voices = new Map<string, RemoteVoice>();

  add(peerId: string, voice: RemoteVoice): void {
    this.remove(peerId);
    this.voices.set(peerId, voice);
  }

  get(peerId: string): RemoteVoice | undefined {
    return this.voices.get(peerId);
  }

  forEach(callback: (peerId: string, voice: RemoteVoice) => void): void {
    this.voices.forEach((voice, peerId) => callback(peerId, voice));
  }

  remove(peerId: string): void {
    const existing = this.voices.get(peerId);
    if (existing) {
      existing.route.dispose();
      this.voices.delete(peerId);
    }
  }
}