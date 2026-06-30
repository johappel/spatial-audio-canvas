// Zentrale Typdefinitionen fuer Spatial Audio Canvas.
// Diese Datei buendelt das Datenmodell (Raum, Inseln, Plaetze, Teilnehmende)
// sowie die erweiterbaren Vertraege fuer Interaktionen und Nachrichten.

// ---------------------------------------------------------------------------
// Raum-Datenmodell
// ---------------------------------------------------------------------------

export type IslandType = 'round_table' | 'chair_circle' | 'listening_window' | 'cafe_table';

export type RoomConfig = {
  id: string;
  title: string;
  description?: string;
  defaultIslandId: string;
  islands: ConversationIsland[];
  ambientSources?: AmbientSource[];
};

export type ConversationIsland = {
  id: string;
  title: string;
  description?: string;
  type: IslandType;
  maxParticipants: number;
  centerX: number;
  centerY: number;
  seats: Seat[];
  ambientSourceIds?: string[];
};

export type Seat = {
  id: string;
  islandId: string;
  label: string;
  angleDeg: number;
  radius: number;
  // x beschreibt links/rechts, z beschreibt vorne/hinten.
  x: number;
  z: number;
  occupiedBy?: string;
};

export type Participant = {
  id: string;
  displayName: string;
  color: string;
  islandId: string;
  seatId: string;
  isLocal: boolean;
  isMuted: boolean;
  speakingLevel: number; // 0.0 bis 1.0
  isSpeaking: boolean;
};

export type AmbientKind = 'ambience' | 'music' | 'podcast' | 'signal';

export type AmbientSource = {
  id: string;
  title: string;
  kind: AmbientKind;
  src: string;
  islandId?: string;
  seatId?: string;
  x?: number;
  z?: number;
  loop: boolean;
  defaultVolume: number;
  userControllable: boolean;
};

export type RoomState = {
  roomId: string;
  localParticipantId: string;
  participants: Record<string, Participant>;
  occupiedSeats: Record<string, string>; // seatId -> participantId
  activeAmbientSources: Record<string, boolean>;
};

// ---------------------------------------------------------------------------
// Nachrichten- und Interaktionsvertraege (erweiterbar)
// ---------------------------------------------------------------------------

// Reservierte Kanaele des Kerns. Plugins duerfen eigene Kanaele ergaenzen,
// daher ist der Typ bewusst offen gehalten.
export type CoreMessageChannel =
  | 'presence'
  | 'chat'
  | 'emote'
  | 'game'
  | 'sound-gesture';

export type MessageChannel = CoreMessageChannel | (string & {});

// Generischer Umschlag fuer alle ueber den DataChannel gesendeten Nachrichten.
export type MessageEnvelope<TPayload = unknown> = {
  channel: MessageChannel;
  type: string;
  senderId: string;
  // Zeitstempel in ms seit Epoch (lokal gesetzt).
  sentAt: number;
  payload: TPayload;
};

export type ChatMessagePayload = {
  text: string;
};

export type EmotePayload = {
  emote: string; // z.B. "wave", "applause", "heart"
};

export type SoundGesturePayload = {
  gestureId: string; // verweist auf eine registrierte Klanggeste
};

export type GameMessagePayload = {
  gameId: string;
  action: string;
  data?: unknown;
};

export type PresencePayload = {
  participant: Omit<Participant, 'isLocal'>;
};