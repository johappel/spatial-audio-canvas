// Austauschbare Signalling-Schnittstelle. Die WebSocket-Implementierung
// kann spaeter durch einen gehosteten Dienst ersetzt werden, ohne die
// uebrige Anwendung zu aendern.
export type SignalMessage =
  | { kind: 'join'; roomId: string; peerId: string }
  | { kind: 'peers'; peers: string[] }
  | { kind: 'offer'; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { kind: 'answer'; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { kind: 'ice'; from: string; to: string; candidate: RTCIceCandidateInit }
  | { kind: 'leave'; peerId: string };

export interface SignalingClient {
  connect(roomId: string, peerId: string): Promise<void>;
  send(message: SignalMessage): void;
  onMessage(handler: (message: SignalMessage) => void): void;
  close(): void;
}

export class WebSocketSignalingClient implements SignalingClient {
  private socket: WebSocket | null = null;
  private handler: ((message: SignalMessage) => void) | null = null;

  constructor(private readonly url: string) {}

  connect(roomId: string, peerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.url);
      this.socket = socket;
      socket.addEventListener('open', () => {
        this.send({ kind: 'join', roomId, peerId });
        resolve();
      });
      socket.addEventListener('error', (event) => reject(event));
      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(String(event.data)) as SignalMessage;
          this.handler?.(message);
        } catch (error) {
          console.warn('[Signaling] Ungueltige Nachricht', error);
        }
      });
    });
  }

  send(message: SignalMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  onMessage(handler: (message: SignalMessage) => void): void {
    this.handler = handler;
  }

  close(): void {
    this.socket?.close();
    this.socket = null;
  }
}