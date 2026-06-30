// Verwaltet WebRTC-Verbindungen im Mesh: lokale Audiospur senden,
// Remote-Spuren empfangen und einen DataChannel je Peer betreiben.
import type { SignalingClient, SignalMessage } from './SignalingClient';

export interface PeerEvents {
  onPeerJoined(peerId: string): void;
  onPeerLeft(peerId: string): void;
  onRemoteStream(peerId: string, stream: MediaStream): void;
  onRemoteData(peerId: string, data: string): void;
  onDataChannelOpen(peerId: string): void;
}

export class PeerConnectionManager {
  private readonly peers = new Map<string, RTCPeerConnection>();
  private readonly channels = new Map<string, RTCDataChannel>();
  private localStream: MediaStream | null = null;

  constructor(
    private readonly signaling: SignalingClient,
    private readonly localId: string,
    private readonly iceServers: RTCIceServer[],
    private readonly events: PeerEvents,
  ) {}

  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
  }

  async start(roomId: string): Promise<void> {
    this.signaling.onMessage((message) => {
      void this.handleSignal(message);
    });
    await this.signaling.connect(roomId, this.localId);
  }

  broadcast(data: string): void {
    this.channels.forEach((channel) => {
      if (channel.readyState === 'open') {
        channel.send(data);
      }
    });
  }

  close(): void {
    [...this.peers.keys()].forEach((id) => this.removePeer(id));
    this.signaling.close();
  }

  private createPeer(remoteId: string, initiator: boolean): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peers.set(remoteId, pc);

    this.localStream?.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream as MediaStream);
    });

    pc.onicecandidate = (event): void => {
      if (event.candidate) {
        this.signaling.send({
          kind: 'ice',
          from: this.localId,
          to: remoteId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event): void => {
      const [stream] = event.streams;
      if (stream) {
        this.events.onRemoteStream(remoteId, stream);
      }
    };

    pc.onconnectionstatechange = (): void => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        this.removePeer(remoteId);
      }
    };

    if (initiator) {
      this.setupChannel(remoteId, pc.createDataChannel('sac'));
    } else {
      pc.ondatachannel = (event): void => this.setupChannel(remoteId, event.channel);
    }

    return pc;
  }

  private setupChannel(remoteId: string, channel: RTCDataChannel): void {
    this.channels.set(remoteId, channel);
    channel.onopen = (): void => this.events.onDataChannelOpen(remoteId);
    channel.onmessage = (event): void => this.events.onRemoteData(remoteId, String(event.data));
  }

  private async handleSignal(message: SignalMessage): Promise<void> {
    switch (message.kind) {
      case 'peers': {
        for (const peerId of message.peers) {
          if (peerId === this.localId || this.peers.has(peerId)) {
            continue;
          }
          // Deterministischer Initiator: die kleinere Id baut die Verbindung auf.
          const initiator = this.localId < peerId;
          const pc = this.createPeer(peerId, initiator);
          this.events.onPeerJoined(peerId);
          if (initiator) {
            await this.makeOffer(peerId, pc);
          }
        }
        break;
      }
      case 'offer': {
        if (message.to !== this.localId) {
          return;
        }
        let pc = this.peers.get(message.from);
        if (!pc) {
          pc = this.createPeer(message.from, false);
          this.events.onPeerJoined(message.from);
        }
        await pc.setRemoteDescription(message.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.signaling.send({ kind: 'answer', from: this.localId, to: message.from, sdp: answer });
        break;
      }
      case 'answer': {
        if (message.to !== this.localId) {
          return;
        }
        await this.peers.get(message.from)?.setRemoteDescription(message.sdp);
        break;
      }
      case 'ice': {
        if (message.to !== this.localId) {
          return;
        }
        await this.peers.get(message.from)?.addIceCandidate(message.candidate);
        break;
      }
      case 'leave': {
        this.removePeer(message.peerId);
        break;
      }
      default:
        break;
    }
  }

  private async makeOffer(remoteId: string, pc: RTCPeerConnection): Promise<void> {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.signaling.send({ kind: 'offer', from: this.localId, to: remoteId, sdp: offer });
  }

  private removePeer(remoteId: string): void {
    this.channels.get(remoteId)?.close();
    this.peers.get(remoteId)?.close();
    this.channels.delete(remoteId);
    if (this.peers.delete(remoteId)) {
      this.events.onPeerLeft(remoteId);
    }
  }
}