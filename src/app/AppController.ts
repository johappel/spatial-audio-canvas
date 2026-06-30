// Zentraler Orchestrator: verbindet Store, Audio, RTC und Plugins und stellt
// der UI klare Aktionen bereit. Die UI-Komponenten kennen nur diesen Controller.
import { EventBus } from '../core/EventBus';
import type { AppEventBus } from '../core/events';
import type { AppContext } from '../core/context';
import { PluginHost } from '../core/PluginHost';
import { UiRegionRegistry } from '../core/UiRegions';
import {
  $ambientVolume,
  $participants,
  $currentIslandId,
  $localParticipantId,
  $micEnabled,
  $roomConfig,
  $view,
  getLocalParticipant,
  removeParticipant,
  upsertParticipant,
} from '../core/Store';
import { AudioEngine } from '../audio/AudioEngine';
import { KlangNodeRegistry } from '../audio/KlangNodeRegistry';
import { SimulatedVoice, createVoiceishBuffer } from '../audio/SimulatedVoice';
import { MediaSourceRegistry, createDefaultMediaHandler } from '../media/MediaSourceRegistry';
import { Announcer } from '../accessibility/Announcer';
import { loadRoomConfig } from '../room/RoomConfigLoader';
import { findIsland } from '../room/RoomState';
import { claimSeat, firstFreeSeat } from '../room/SeatingRules';
import { computeEgoViews } from '../room/EgoPerspective';
import { WebSocketSignalingClient } from '../rtc/SignalingClient';
import { PeerConnectionManager } from '../rtc/PeerConnectionManager';
import { DataChannelBus } from '../rtc/DataChannelBus';
import { PresenceSync } from '../rtc/PresenceSync';
import { RemoteStreamRegistry } from '../rtc/RemoteStreamRegistry';
import { routeVoice } from '../audio/AudioRouting';
import { VoiceLevelAnalyser } from '../audio/VoiceLevelAnalyser';
import { AmbientBed } from '../audio/AmbientBed';
import { createBuiltinPlugins } from '../plugins';
import type { ConversationIsland, MessageChannel, Participant, RoomConfig, Seat } from '../types';

const PALETTE = ['#e8743b', '#3a6ea5', '#5aa469', '#9b5de5', '#f15bb5', '#00bbf9'];
const DEMO_NAMES = ['Karl', 'Erna', 'Maria'];

export class AppController {
  readonly bus: AppEventBus = new EventBus();
  readonly audio = new AudioEngine();
  readonly klangNodes = new KlangNodeRegistry();
  readonly media = new MediaSourceRegistry();
  readonly announcer = new Announcer();
  readonly ui = new UiRegionRegistry();

  readonly localId = crypto.randomUUID();
  private displayName = 'Gast';
  private occupied: Record<string, string> = {};

  private pluginHost!: PluginHost;
  private dataChannelBus: DataChannelBus | null = null;
  private presence: PresenceSync | null = null;
  private peers: PeerConnectionManager | null = null;
  private readonly remoteVoices = new RemoteStreamRegistry();

  private localStream: MediaStream | null = null;
  private readonly simVoices = new Map<string, SimulatedVoice>();
  private rafId = 0;
  private localAnalyser: VoiceLevelAnalyser | null = null;
  private ambientBed: AmbientBed | null = null;
  private readonly remoteAudioEls = new Map<string, HTMLAudioElement>();

  async init(roomId = 'demo-table'): Promise<void> {
    for (const kind of ['ambience', 'music', 'podcast', 'signal'] as const) {
      this.media.register(createDefaultMediaHandler(kind, kind));
    }
    const config = await loadRoomConfig(roomId);
    $roomConfig.set(config);
    $currentIslandId.set(config.defaultIslandId);

    this.pluginHost = new PluginHost(this.buildContext());
    await this.pluginHost.registerAll(createBuiltinPlugins());
  }

  private buildContext(): AppContext {
    return {
      bus: this.bus,
      audio: this.audio,
      klangNodes: this.klangNodes,
      media: this.media,
      announcer: this.announcer,
      ui: this.ui,
      localParticipantId: () => this.localId,
      sendMessage: (channel: MessageChannel, type: string, payload: unknown) => {
        if (this.dataChannelBus) {
          this.dataChannelBus.send(channel, type, payload);
        } else {
          // Offline-Fallback: lokal zustellen, damit Plugins auch ohne Server wirken.
          this.bus.emit('message:received', {
            channel,
            type,
            senderId: this.localId,
            sentAt: Date.now(),
            payload,
          });
        }
      },
    };
  }

  get pluginManifests() {
    return this.pluginHost?.manifests() ?? [];
  }

  join(displayName: string): void {
    this.displayName = displayName.trim() || 'Gast';
    $view.set('permission');
  }

  private currentIsland(): ConversationIsland {
    const config = $roomConfig.get() as RoomConfig;
    const island = findIsland(config, $currentIslandId.get());
    if (!island) {
      throw new Error('Aktuelle Insel nicht gefunden.');
    }
    return island;
  }

  async enterWithMic(): Promise<void> {
    await this.audio.unlock();
    this.bus.emit('audio:unlocked', { ok: true });

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      $micEnabled.set(true);
    } catch (error) {
      console.warn('[AppController] Mikrofon nicht verfuegbar, fahre ohne fort.', error);
      $micEnabled.set(false);
    }

    this.seatLocalParticipant();
    // Demo-Personen nur im Offline-Modus (sonst kollidieren sie mit echten Gaesten).
    if (!import.meta.env.VITE_SIGNALING_URL) {
      this.spawnDemoParticipants();
    }
    this.setupLocalAnalyser();
    this.setupAmbientBed();
    this.applySpatialization();
    await this.connectRtc();
    this.startLevelLoop();

    $view.set('canvas');
    this.announcer.announce('Du hast den Raum betreten. Waehle bei Bedarf einen anderen Platz.');
  }

  private seatLocalParticipant(): void {
    const island = this.currentIsland();
    const free = island.seats.filter((s) => !this.occupied[s.id]);
    const seat = free.length > 0 ? free[Math.floor(Math.random() * free.length)] : island.seats[0];
    const result = claimSeat(this.occupied, seat.id, this.localId);
    this.occupied = result.occupied;
    const participant: Participant = {
      id: this.localId,
      displayName: this.displayName,
      color: PALETTE[0],
      islandId: island.id,
      seatId: seat.id,
      isLocal: true,
      isMuted: false,
      speakingLevel: 0,
      isSpeaking: false,
    };
    upsertParticipant(participant);
    $localParticipantId.set(this.localId);
  }

  private spawnDemoParticipants(): void {
    const island = this.currentIsland();
    if (!this.audio.isUnlocked) {
      return;
    }
    const buffer = createVoiceishBuffer(this.audio.context);
    DEMO_NAMES.forEach((name, index) => {
      const seat = firstFreeSeat(island, this.occupied);
      if (!seat) {
        return;
      }
      const id = `demo-${name.toLowerCase()}`;
      const claim = claimSeat(this.occupied, seat.id, id);
      this.occupied = claim.occupied;
      upsertParticipant({
        id,
        displayName: name,
        color: PALETTE[(index + 1) % PALETTE.length],
        islandId: island.id,
        seatId: seat.id,
        isLocal: false,
        isMuted: false,
        speakingLevel: 0,
        isSpeaking: false,
      });
      this.simVoices.set(id, new SimulatedVoice(this.audio, buffer));
    });
  }

  // Berechnet Pan und Distanz aller simulierten Stimmen aus der eigenen Sicht.
  private applySpatialization(): void {
    const island = this.currentIsland();
    const local = getLocalParticipant();
    if (!local) {
      return;
    }
    const views = computeEgoViews(island.seats, local.seatId);
    const bySeat = new Map(views.map((view) => [view.seatId, view]));
    this.simVoices.forEach((voice, participantId) => {
      const participant = this.participant(participantId);
      const view = participant ? bySeat.get(participant.seatId) : undefined;
      if (view) {
        voice.setPan(view.relativeX);
        voice.setDistance(view.relativeDistance);
      }
    });
    this.remoteVoices.forEach((peerId, voice) => {
      const participant = this.participant(peerId);
      if (!participant) {
        return;
      }
      if (participant.islandId !== island.id) {
        // Andere Insel: leise und mittig, damit Anwesenheit spuerbar bleibt,
        // aber das eigene Gespraech nicht ueberlagert wird.
        voice.route.spatializer.setPan(0);
        voice.route.spatializer.setGain(1, false);
        return;
      }
      const view = bySeat.get(participant.seatId);
      if (view) {
        voice.route.spatializer.setPan(view.relativeX);
        voice.route.spatializer.setGain(view.relativeDistance, true);
      }
    });
  }

  private participant(id: string): Participant | undefined {
    return $participants.get()[id];
  }

  private participantsSnapshot(): Record<string, Participant> {
    return $participants.get();
  }

  // Demo-Aktion: laesst eine simulierte Person sprechen.
  speakAs(participantId: string): void {
    const voice = this.simVoices.get(participantId);
    voice?.speak();
  }

  selectSeat(seatId: string): void {
    const result = claimSeat(this.occupied, seatId, this.localId);
    if (!result.ok) {
      this.announcer.announce(result.reason ?? 'Platz nicht verfuegbar.', true);
      return;
    }
    this.occupied = result.occupied;
    const local = getLocalParticipant();
    if (local) {
      upsertParticipant({ ...local, seatId });
    }
    this.applySpatialization();
    this.bus.emit('seat:changed', { participantId: this.localId, seatId });
    this.announceLocalPresence();
    this.announcer.announce('Du hast den Platz gewechselt.');
  }

  switchIsland(islandId: string): void {
    const config = $roomConfig.get() as RoomConfig;
    const island = findIsland(config, islandId);
    if (!island) {
      return;
    }
    $currentIslandId.set(islandId);
    const seat = firstFreeSeat(island, this.occupied) ?? island.seats[0];
    const result = claimSeat(this.occupied, seat.id, this.localId);
    this.occupied = result.occupied;
    const local = getLocalParticipant();
    if (local) {
      upsertParticipant({ ...local, islandId, seatId: seat.id });
    }
    this.applySpatialization();
    this.announceLocalPresence();
    this.announcer.announce(`Du bist jetzt bei: ${island.title}.`);
  }

  toggleMute(): void {
    const local = getLocalParticipant();
    if (!local) {
      return;
    }
    const isMuted = !local.isMuted;
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
    upsertParticipant({ ...local, isMuted });
    this.announceLocalPresence();
    this.announcer.announce(isMuted ? 'Mikrofon ist aus.' : 'Mikrofon ist an.');
  }

  setAmbientVolume(value: number): void {
    $ambientVolume.set(value);
    this.ambientBed?.setVolume(value);
  }

  private setupLocalAnalyser(): void {
    if (!this.localStream || !this.audio.isUnlocked) {
      return;
    }
    const source = this.audio.context.createMediaStreamSource(this.localStream);
    // Nur Analyse, keine Verbindung zum Ausgang -> kein Echo.
    this.localAnalyser = new VoiceLevelAnalyser(this.audio.context, source);
  }

  private setupAmbientBed(): void {
    if (!this.audio.isUnlocked) {
      return;
    }
    this.ambientBed = new AmbientBed(this.audio, $ambientVolume.get());
  }

  private announceLocalPresence(): void {
    const local = getLocalParticipant();
    if (local) {
      this.presence?.announceLocal(local);
    }
  }

  private async connectRtc(): Promise<void> {
    const url = import.meta.env.VITE_SIGNALING_URL as string | undefined;
    if (!url) {
      console.info('[AppController] Kein VITE_SIGNALING_URL gesetzt - Offline-Demo-Modus.');
      return;
    }
    try {
      const iceServers = this.readIceServers();
      const signaling = new WebSocketSignalingClient(url);
      const peers = new PeerConnectionManager(signaling, this.localId, iceServers, {
        onPeerJoined: (peerId) => console.info('[RTC] Peer beigetreten', peerId),
        onPeerLeft: (peerId) => {
          this.remoteVoices.remove(peerId);
          this.remoteAudioEls.get(peerId)?.pause();
          this.remoteAudioEls.delete(peerId);
          removeParticipant(peerId);
        },
        onRemoteStream: (peerId, stream) => this.handleRemoteStream(peerId, stream),
        onRemoteData: (_peerId, data) => this.dataChannelBus?.handleIncoming(data),
        onDataChannelOpen: () => this.announceLocalPresence(),
      });
      if (this.localStream) {
        peers.setLocalStream(this.localStream);
      }
      this.peers = peers;
      this.dataChannelBus = new DataChannelBus(peers, this.bus, this.localId);
      this.dataChannelBus.init();
      this.presence = new PresenceSync(this.bus, this.localId);
      this.presence.init();
      this.bus.on('message:received', (envelope) => {
        if (envelope.channel === 'presence') {
          this.applySpatialization();
        }
      });
      await peers.start(this.currentIsland().id);
      this.announceLocalPresence();
    } catch (error) {
      console.warn('[AppController] RTC-Verbindung fehlgeschlagen, bleibe offline.', error);
    }
  }

  private handleRemoteStream(peerId: string, stream: MediaStream): void {
    if (!this.audio.isUnlocked) {
      return;
    }
    // In manchen Browsern liefert ein reiner WebAudio-Pfad keinen Ton, solange
    // der Stream nicht zusaetzlich an ein (stummes) Audio-Element gebunden ist.
    const element = new Audio();
    element.srcObject = stream;
    element.muted = true;
    element.autoplay = true;
    void element.play().catch(() => undefined);
    this.remoteAudioEls.set(peerId, element);

    const source = this.audio.context.createMediaStreamSource(stream);
    const route = routeVoice(this.audio, source);
    this.remoteVoices.add(peerId, { stream, route });
    this.applySpatialization();
  }

  private readIceServers(): RTCIceServer[] {
    const stun = (import.meta.env.VITE_STUN_URLS as string | undefined) ?? 'stun:stun.l.google.com:19302';
    const servers: RTCIceServer[] = [{ urls: stun.split(',').map((u) => u.trim()) }];
    const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
    if (turnUrl) {
      servers.push({
        urls: turnUrl,
        username: import.meta.env.VITE_TURN_USERNAME as string | undefined,
        credential: import.meta.env.VITE_TURN_CREDENTIAL as string | undefined,
      });
    }
    return servers;
  }

  private startLevelLoop(): void {
    const tick = (): void => {
      this.simVoices.forEach((voice, participantId) => {
        const level = voice.measureLevel();
        const participant = this.participantsSnapshot()[participantId];
        if (!participant) {
          return;
        }
        const speaking = level > 0.02;
        if (Math.abs(level - participant.speakingLevel) > 0.015 || speaking !== participant.isSpeaking) {
          upsertParticipant({ ...participant, speakingLevel: level, isSpeaking: speaking });
        }
      });

      if (this.localAnalyser) {
        const local = getLocalParticipant();
        if (local) {
          const level = local.isMuted ? 0 : this.localAnalyser.measure();
          const speaking = level > 0.02;
          if (
            Math.abs(level - local.speakingLevel) > 0.015 ||
            speaking !== local.isSpeaking
          ) {
            upsertParticipant({ ...local, speakingLevel: level, isSpeaking: speaking });
          }
        }
      }

      this.remoteVoices.forEach((peerId, voice) => {
        const level = voice.route.analyser.measure();
        const participant = this.participantsSnapshot()[peerId];
        if (!participant) {
          return;
        }
        const speaking = level > 0.02;
        if (Math.abs(level - participant.speakingLevel) > 0.015 || speaking !== participant.isSpeaking) {
          upsertParticipant({ ...participant, speakingLevel: level, isSpeaking: speaking });
        }
      });

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  dispose(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.simVoices.forEach((voice) => voice.dispose());
    this.ambientBed?.dispose();
    this.peers?.close();
  }

  seatsOfCurrentIsland(): Seat[] {
    return this.currentIsland().seats;
  }
}

let controller: AppController | null = null;

export function setAppController(instance: AppController): void {
  controller = instance;
}

export function getAppController(): AppController {
  if (!controller) {
    throw new Error('AppController noch nicht initialisiert.');
  }
  return controller;
}