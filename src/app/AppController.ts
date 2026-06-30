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
  $whisperInvite,
  $whisperPartnerId,
  getLocalParticipant,
  participantsInIsland,
  removeParticipant,
  upsertParticipant,
} from '../core/Store';
import { AudioEngine } from '../audio/AudioEngine';
import { KlangNodeRegistry } from '../audio/KlangNodeRegistry';
import { SimulatedVoice, createVoiceishBuffer } from '../audio/SimulatedVoice';
import { MediaSourceRegistry, createDefaultMediaHandler } from '../media/MediaSourceRegistry';
import { Announcer } from '../accessibility/Announcer';
import { loadRoomConfig } from '../room/RoomConfigLoader';
import { findIsland, findSeat } from '../room/RoomState';
import { claimSeat, firstFreeSeat, seatNextTo } from '../room/SeatingRules';
import { STAGE_ASPECT, computeScreenSeats, spatialFor } from '../room/WorldLayout';
import { WebSocketSignalingClient } from '../rtc/SignalingClient';
import { PeerConnectionManager } from '../rtc/PeerConnectionManager';
import { DataChannelBus } from '../rtc/DataChannelBus';
import { PresenceSync } from '../rtc/PresenceSync';
import { RemoteStreamRegistry } from '../rtc/RemoteStreamRegistry';
import { routeVoice } from '../audio/AudioRouting';
import { VoiceLevelAnalyser } from '../audio/VoiceLevelAnalyser';
import { AmbientBed } from '../audio/AmbientBed';
import { VoiceNormalizer } from '../audio/VoiceNormalizer';
import { IslandMurmurBed } from '../audio/IslandMurmurBed';
import { ProceduralAmbientPlayer } from '../audio/ProceduralAmbientPlayer';
import type { MediaPlayback } from '../media/MediaSource';
import { createBuiltinPlugins } from '../plugins';
import type {
  ConversationIsland,
  MessageChannel,
  MessageEnvelope,
  Participant,
  RoomConfig,
  Seat,
  WhisperPayload,
} from '../types';

const PALETTE = ['#e8743b', '#3a6ea5', '#5aa469', '#9b5de5', '#f15bb5', '#00bbf9'];
const DEMO_NAMES = ['Karl', 'Erna', 'Maria'];

// Tuschel-Gain (Phase G): Partner lauter, uebrige Insel fuer das Paar leiser,
// und Aussenstehende, die selbst tuscheln, fuer mich leiser.
const WHISPER_PARTNER_BOOST = 1.6;
const WHISPER_OTHERS_DUCK = 0.25;
const WHISPER_BYSTANDER_DUCK = 0.4;

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
  private readonly normalizer = new VoiceNormalizer();
  private readonly spatialGain = new Map<string, number>();
  private readonly manualVolume = new Map<string, number>();
  private readonly murmurBeds = new Map<string, IslandMurmurBed>();
  private readonly murmurDistance = new Map<string, number>();
  private readonly ambientPlayers = new Map<string, MediaPlayback>();

  async init(roomId = 'demo-table'): Promise<void> {
    for (const kind of ['ambience', 'music', 'podcast', 'signal'] as const) {
      this.media.register(createDefaultMediaHandler(kind, kind));
    }
    // Prozedurale Klangbetten (ohne Audiodatei) fuer Insel-Ambiente.
    this.media.register({
      kind: 'procedural',
      title: 'Prozedurales Klangbett',
      create: (ctx, destination, source) => new ProceduralAmbientPlayer(ctx, destination, source),
    });
    const config = await loadRoomConfig(roomId);
    $roomConfig.set(config);
    $currentIslandId.set(config.defaultIslandId);

    this.bus.on('message:received', (envelope) => this.handleWhisperMessage(envelope));

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
      localIslandId: () => $currentIslandId.get(),
      sendMessage: (channel: MessageChannel, type: string, payload: unknown) => {
        const envelope: MessageEnvelope = {
          channel,
          type,
          senderId: this.localId,
          sentAt: Date.now(),
          islandId: $currentIslandId.get(),
          payload,
        };
        if (this.dataChannelBus) {
          this.dataChannelBus.sendEnvelope(envelope);
        } else {
          // Offline-Fallback: lokal zustellen, damit Plugins auch ohne Server wirken.
          this.bus.emit('message:received', envelope);
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
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          noiseSuppression: true,
          // echoCancellation bewusst AUS: ist es an, oeffnet Chrome die Audio-
          // ausgabe im "Communications"-Modus, woraufhin Windows alle anderen
          // Klaenge (auch das Ambiente) um ~80% absenkt, sobald WebRTC-Audio
          // eines zweiten Nutzers fliesst. Kopfhoerer sind ohnehin empfohlen.
          echoCancellation: false,
        },
        video: false,
      });
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
    this.updateAmbientSources();
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
  // Spatialisierung im gemeinsamen Weltraum: Pan/Gain jeder Stimme ergeben
  // sich aus der Bildschirmposition relativ zum eigenen Sitz - eine Formel fuer
  // eigene und benachbarte Inseln. Andere Inseln werden allein durch Distanz
  // leiser (kein harter Kanal-Schnitt).
  private applySpatialization(): void {
    const config = $roomConfig.get();
    const local = getLocalParticipant();
    if (!config || !local) {
      return;
    }
    const screens = computeScreenSeats(config, local.seatId);
    const byId = new Map(screens.map((seat) => [seat.seatId, seat]));
    const localScreen = byId.get(local.seatId);
    if (!localScreen) {
      return;
    }
    this.simVoices.forEach((voice, participantId) => {
      const participant = this.participant(participantId);
      const sp = participant ? byId.get(participant.seatId) : undefined;
      if (sp) {
        const { pan, gain } = spatialFor(localScreen, sp);
        this.spatialGain.set(participantId, gain);
        voice.setPan(this.panFor(participantId, pan));
        voice.setGainValue(this.combinedGain(participantId));
      }
    });
    this.remoteVoices.forEach((peerId, voice) => {
      const participant = this.participant(peerId);
      const sp = participant ? byId.get(participant.seatId) : undefined;
      if (sp) {
        const { pan, gain } = spatialFor(localScreen, sp);
        this.spatialGain.set(peerId, gain);
        voice.route.spatializer.setPan(this.panFor(peerId, pan));
        voice.route.spatializer.setGainValue(this.combinedGain(peerId));
      }
    });

    this.updateMurmurBeds(config, byId, localScreen);
  }

  // Erzeugt/aktualisiert je ENTFERNTER Insel ein Gemurmel-Bett, gepannt an die
  // Bildschirmposition der Insel. Die Lautstaerke folgt in der Pegelschleife der
  // Aktivitaet (Belegung + Sprechen) und der Distanz.
  private updateMurmurBeds(
    config: RoomConfig,
    byId: ReadonlyMap<string, { x: number; y: number }>,
    localScreen: { x: number; y: number },
  ): void {
    if (!this.audio.isUnlocked) {
      return;
    }
    const currentId = $currentIslandId.get();
    const seen = new Set<string>();
    for (const island of config.islands) {
      if (island.id === currentId) {
        continue;
      }
      const pts = island.seats
        .map((s) => byId.get(s.id))
        .filter((p): p is { x: number; y: number } => Boolean(p));
      if (pts.length === 0) {
        continue;
      }
      const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
      const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
      const dist = Math.hypot((cx - localScreen.x) * STAGE_ASPECT, cy - localScreen.y);
      const pan = Math.max(-0.85, Math.min(0.85, (cx - localScreen.x) * 1.5));
      const distanceFactor = Math.max(0, 1 - dist * 1.1);
      let bed = this.murmurBeds.get(island.id);
      if (!bed) {
        bed = new IslandMurmurBed(this.audio);
        this.murmurBeds.set(island.id, bed);
      }
      bed.setPan(pan);
      this.murmurDistance.set(island.id, distanceFactor);
      seen.add(island.id);
    }
    for (const [id, bed] of this.murmurBeds) {
      if (!seen.has(id)) {
        bed.dispose();
        this.murmurBeds.delete(id);
        this.murmurDistance.delete(id);
      }
    }
  }

  private participant(id: string): Participant | undefined {
    return $participants.get()[id];
  }

  // Endgain = raeumlich * Auto-Leveling * manuell * Tuschel * Insel-Audio.
  private combinedGain(id: string): number {
    const spatial = this.spatialGain.get(id) ?? 1;
    const manual = this.manualVolume.get(id) ?? 1;
    return (
      spatial *
      this.normalizer.gainFor(id) *
      manual *
      this.whisperFactor(id) *
      this.islandAudioFactor(id)
    );
  }

  // Phase E (Stufe 1): echte Stimmen anderer Inseln werden hoererseitig stumm
  // geschaltet und allein durch das Gemurmel repraesentiert. Der Tuschel-Partner
  // bleibt immer hoerbar. (Stufe 2 - echtes Track-Scoping/Renegotiation - folgt.)
  private islandAudioFactor(id: string): number {
    if (id === $whisperPartnerId.get()) {
      return 1;
    }
    const p = this.participant(id);
    if (!p) {
      return 1;
    }
    return p.islandId === $currentIslandId.get() ? 1 : 0;
  }

  // Tuschel-Override: Partner lauter, uebrige Insel leiser; Aussenstehende, die
  // selbst tuscheln, ebenfalls leiser. Rein hoererseitig (kooperativ).
  private whisperFactor(id: string): number {
    const partner = $whisperPartnerId.get();
    if (partner) {
      return id === partner ? WHISPER_PARTNER_BOOST : WHISPER_OTHERS_DUCK;
    }
    return this.participant(id)?.whisperWith ? WHISPER_BYSTANDER_DUCK : 1;
  }

  // Beim Tuscheln rueckt die Partnerstimme akustisch in die Mitte.
  private panFor(id: string, pan: number): number {
    return id === $whisperPartnerId.get() ? 0 : pan;
  }

  // Manueller Lautstaerke-Regler je Person (0..2), rein hoererseitig.
  setParticipantVolume(participantId: string, value: number): void {
    this.manualVolume.set(participantId, Math.max(0, Math.min(2, value)));
  }

  getParticipantVolume(participantId: string): number {
    return this.manualVolume.get(participantId) ?? 1;
  }

  // --- Tuscheln / privater Dialog (Phase G) ---

  // Bittet eine Person zum Tuscheln. Offline/Demo startet direkt, sonst per
  // einvernehmlicher Einladung ueber den Whisper-Kanal.
  requestWhisper(targetId: string): void {
    const target = this.participant(targetId);
    if (!target || targetId === this.localId) {
      return;
    }
    if ($whisperPartnerId.get() === targetId) {
      return;
    }
    if (!this.dataChannelBus || targetId.startsWith('demo-')) {
      this.startWhisper(targetId);
      return;
    }
    this.bus.emit('message:send', {
      channel: 'whisper',
      type: 'invite',
      senderId: this.localId,
      sentAt: Date.now(),
      payload: { targetId },
    });
    this.announcer.announce(`Tuschel-Einladung an ${target.displayName} gesendet.`);
  }

  acceptWhisper(): void {
    const invite = $whisperInvite.get();
    if (!invite) {
      return;
    }
    this.dataChannelBus?.send('whisper', 'accept', { targetId: invite.fromId });
    $whisperInvite.set(null);
    this.startWhisper(invite.fromId);
  }

  declineWhisper(): void {
    const invite = $whisperInvite.get();
    if (!invite) {
      return;
    }
    this.dataChannelBus?.send('whisper', 'decline', { targetId: invite.fromId });
    $whisperInvite.set(null);
    this.announcer.announce('Tuschel-Einladung abgelehnt.');
  }

  endWhisper(): void {
    const partner = $whisperPartnerId.get();
    if (!partner) {
      return;
    }
    this.dataChannelBus?.send('whisper', 'end', { targetId: partner });
    this.setLocalWhisper(undefined);
    $whisperPartnerId.set(null);
    this.applySpatialization();
    this.announcer.announce('Tuscheln beendet.');
  }

  isWhispering(): boolean {
    return $whisperPartnerId.get() !== null;
  }

  private startWhisper(partnerId: string): void {
    $whisperPartnerId.set(partnerId);
    this.setLocalWhisper(partnerId);
    this.applySpatialization();
    const partner = this.participant(partnerId);
    this.announcer.announce(
      `Du tuschelst jetzt mit ${partner?.displayName ?? 'jemandem'}. Andere hoeren euch nur leise.`,
    );
  }

  private setLocalWhisper(partnerId: string | undefined): void {
    const local = getLocalParticipant();
    if (local) {
      upsertParticipant({ ...local, whisperWith: partnerId });
      this.announceLocalPresence();
    }
  }

  private handleWhisperMessage(envelope: MessageEnvelope): void {
    if (envelope.channel !== 'whisper' || envelope.senderId === this.localId) {
      return;
    }
    const payload = envelope.payload as WhisperPayload;
    switch (envelope.type) {
      case 'invite': {
        if (payload.targetId !== this.localId) {
          return;
        }
        if ($whisperPartnerId.get()) {
          this.dataChannelBus?.send('whisper', 'decline', { targetId: envelope.senderId });
          return;
        }
        const from = this.participant(envelope.senderId);
        $whisperInvite.set({ fromId: envelope.senderId, fromName: from?.displayName ?? 'Jemand' });
        this.announcer.announce(`${from?.displayName ?? 'Jemand'} moechte mit dir tuscheln.`, true);
        break;
      }
      case 'accept':
        if (payload.targetId === this.localId) {
          this.startWhisper(envelope.senderId);
        }
        break;
      case 'decline':
        if (payload.targetId === this.localId) {
          this.announcer.announce('Die Tuschel-Einladung wurde abgelehnt.');
        }
        break;
      case 'end':
        if (envelope.senderId === $whisperPartnerId.get()) {
          this.setLocalWhisper(undefined);
          $whisperPartnerId.set(null);
          this.applySpatialization();
          this.announcer.announce('Das Tuscheln wurde beendet.');
        }
        break;
      default:
        break;
    }
  }

  private participantsSnapshot(): Record<string, Participant> {
    return $participants.get();
  }

  // Demo-Aktion: laesst eine simulierte Person sprechen.
  speakAs(participantId: string): void {
    const voice = this.simVoices.get(participantId);
    voice?.speak();
  }

  // Platzwechsel - funktioniert inselUEbergreifend: ein Klick auf einen Stuhl
  // einer anderen Insel ist zugleich der Inselwechsel.
  selectSeat(seatId: string): void {
    const config = $roomConfig.get();
    if (!config) {
      return;
    }
    const seat = findSeat(config, seatId);
    if (!seat) {
      return;
    }
    const result = claimSeat(this.occupied, seatId, this.localId);
    if (!result.ok) {
      this.announcer.announce(result.reason ?? 'Platz nicht verfuegbar.', true);
      return;
    }
    this.occupied = result.occupied;
    const islandChanged = $currentIslandId.get() !== seat.islandId;
    const local = getLocalParticipant();
    if (local) {
      upsertParticipant({ ...local, seatId, islandId: seat.islandId });
    }
    if (islandChanged) {
      $currentIslandId.set(seat.islandId);
    }
    this.applySpatialization();
    this.updateAmbientSources();
    this.bus.emit('seat:changed', { participantId: this.localId, seatId });
    this.announceLocalPresence();
    if (islandChanged) {
      const island = findIsland(config, seat.islandId);
      this.announcer.announce('Du bist jetzt bei: ' + (island?.title ?? 'einer anderen Insel') + '.');
    } else {
      this.announcer.announce('Du hast den Platz gewechselt.');
    }
  }

  // Setzt dich auf einen freien Platz neben einer Person (ggf. andere Insel).
  sitNextToParticipant(participantId: string): void {
    const config = $roomConfig.get();
    const target = this.participant(participantId);
    if (!config || !target) {
      return;
    }
    const island = findIsland(config, target.islandId);
    if (!island) {
      return;
    }
    const seat = seatNextTo(island, target.seatId, this.occupied);
    if (!seat) {
      this.announcer.announce('Kein freier Platz in der Naehe.', true);
      return;
    }
    this.selectSeat(seat.id);
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
    this.updateAmbientSources();
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
    this.ambientPlayers.forEach((player, id) => player.setVolume(this.ambientVolumeFor(id)));
  }

  // Startet die Klangquellen der aktuellen Insel und stoppt die der anderen.
  private updateAmbientSources(): void {
    if (!this.audio.isUnlocked) {
      return;
    }
    const config = $roomConfig.get();
    if (!config) {
      return;
    }
    const island = findIsland(config, $currentIslandId.get());
    const wanted = new Set(island?.ambientSourceIds ?? []);
    for (const [id, player] of this.ambientPlayers) {
      if (!wanted.has(id)) {
        player.stop();
        player.dispose();
        this.ambientPlayers.delete(id);
      }
    }
    for (const id of wanted) {
      if (this.ambientPlayers.has(id)) {
        continue;
      }
      const source = (config.ambientSources ?? []).find((s) => s.id === id);
      if (!source || !this.media.has(source.kind)) {
        continue;
      }
      const player = this.media.create(this.audio.context, this.audio.ambientGain, source);
      player.setVolume(this.ambientVolumeFor(id));
      player.play();
      this.ambientPlayers.set(id, player);
    }
  }

  private ambientVolumeFor(sourceId: string): number {
    const config = $roomConfig.get();
    const source = config?.ambientSources?.find((s) => s.id === sourceId);
    const base = source?.defaultVolume ?? 0.3;
    return base * $ambientVolume.get();
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
          this.normalizer.remove(peerId);
          this.spatialGain.delete(peerId);
          this.manualVolume.delete(peerId);
          if ($whisperPartnerId.get() === peerId) {
            this.setLocalWhisper(undefined);
            $whisperPartnerId.set(null);
          }
          removeParticipant(peerId);
        },
        onRemoteStream: (peerId, stream) => this.handleRemoteStream(peerId, stream),
        onRemoteData: (_peerId, data) => this.dataChannelBus?.handleIncoming(data),
        onDataChannelOpen: (peerId) => {
          this.announceLocalPresence();
          this.bus.emit('datachannel:open', { peerId });
        },
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
        this.normalizer.update(participantId, level, speaking);
        voice.setGainValue(this.combinedGain(participantId));
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
        this.normalizer.update(peerId, level, speaking);
        voice.route.spatializer.setGainValue(this.combinedGain(peerId));
        if (Math.abs(level - participant.speakingLevel) > 0.015 || speaking !== participant.isSpeaking) {
          upsertParticipant({ ...participant, speakingLevel: level, isSpeaking: speaking });
        }
      });

      this.murmurBeds.forEach((bed, islandId) => {
        const list = participantsInIsland(islandId);
        if (list.length === 0) {
          bed.setActivity(0);
          return;
        }
        const speakingSum = list.reduce(
          (sum, p) => sum + (p.isSpeaking ? p.speakingLevel : 0),
          0,
        );
        // Belegung als sehr leise Basis + Sprechen als deutliche Modulation,
        // damit eine stille Nachbarinsel nicht wie laufendes Ambiente klingt.
        const base = Math.min(0.04, list.length * 0.01);
        const activity = Math.min(0.22, base + speakingSum * 0.6);
        const distance = this.murmurDistance.get(islandId) ?? 0;
        bed.setActivity(activity * distance);
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
    this.murmurBeds.forEach((bed) => bed.dispose());
    this.murmurBeds.clear();
    this.ambientPlayers.forEach((player) => player.dispose());
    this.ambientPlayers.clear();
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