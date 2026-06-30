// Gemeinsames Video-Panel (YouTube) mit synchronisierter Wiedergabe.
// Datenschutz: Die YouTube-IFrame-API wird ERST nach Nutzerinteraktion (Laden
// eines Videos) nachgeladen, und der Player nutzt die nocookie-Domain.
import { LitElement, html } from 'lit';
import { ref } from 'lit/directives/ref.js';

// --- Minimale Typen fuer die YouTube-IFrame-API ---
interface YTPlayer {
  loadVideoById(id: string, startSeconds?: number): void;
  cueVideoById(id: string, startSeconds?: number): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface YTPlayerOptions {
  host?: string;
  width?: string | number;
  height?: string | number;
  videoId?: string;
  playerVars?: Record<string, unknown>;
  events?: {
    onReady?: () => void;
    onStateChange?: (event: { data: number }) => void;
  };
}

interface YTNamespace {
  Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number; CUED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

// Laedt die YouTube-IFrame-API genau einmal und lazy.
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }
  if (apiPromise) {
    return apiPromise;
  }
  apiPromise = new Promise<YTNamespace>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = (): void => {
      previous?.();
      if (window.YT) {
        resolve(window.YT);
      }
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiPromise;
}

// Extrahiert die Video-ID aus URL oder roher ID.
export function parseVideoId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) {
    return value;
  }
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.slice(1);
      return id.length === 11 ? id : null;
    }
    const v = url.searchParams.get('v');
    if (v && v.length === 11) {
      return v;
    }
    const embed = url.pathname.match(/\/embed\/([\w-]{11})/);
    if (embed) {
      return embed[1];
    }
  } catch {
    // keine gueltige URL
  }
  return null;
}

export class WatchPanel extends LitElement {
  static properties = {
    error: { state: true },
  };

  error = '';
  onLoad: (videoId: string) => void = () => {};
  onPlay: (time: number) => void = () => {};
  onPause: (time: number) => void = () => {};

  private host?: HTMLElement;
  private player?: YTPlayer;
  private videoId = '';
  private suppress = false;
  private suppressTimer = 0;

  // Light DOM, damit die YouTube-IFrame-API den Container zuverlaessig findet.
  protected createRenderRoot(): HTMLElement {
    return this;
  }

  private setHost(el: Element | undefined): void {
    if (el instanceof HTMLElement) {
      this.host = el;
    }
  }

  // Wartet, bis der Player-Container gerendert ist. Wichtig fuer spaet
  // Beitretende: der Sync-Zustand kann eintreffen, bevor das Panel gerendert ist.
  private hostReady(): Promise<HTMLElement> {
    if (this.host) {
      return Promise.resolve(this.host);
    }
    return new Promise<HTMLElement>((resolve, reject) => {
      const start = Date.now();
      const check = (): void => {
        if (this.host) {
          resolve(this.host);
        } else if (Date.now() - start > 10000) {
          reject(new Error('Kein Container fuer den Player (Timeout).'));
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
  }

  private async ensurePlayer(videoId?: string): Promise<YTPlayer> {
    if (this.player) {
      return this.player;
    }
    const [yt, wrapper] = await Promise.all([loadYouTubeApi(), this.hostReady()]);
    // YT ersetzt das uebergebene Element durch das IFrame. Damit der Wrapper
    // stabil bleibt (und destroy den Frame wirklich leert), bekommt YT ein
    // frisches Kind-Element statt des Wrappers selbst.
    const mount = document.createElement('div');
    mount.style.width = '100%';
    mount.style.height = '100%';
    wrapper.appendChild(mount);
    this.player = await new Promise<YTPlayer>((resolve) => {
      const player = new yt.Player(mount, {
        host: 'https://www.youtube-nocookie.com',
        width: '100%',
        height: '100%',
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => resolve(player),
          onStateChange: (event) => this.handleState(event.data),
        },
      });
    });
    return this.player;
  }

  private handleState(state: number): void {
    if (this.suppress || !this.player || !window.YT) {
      return;
    }
    const time = this.player.getCurrentTime();
    if (state === window.YT.PlayerState.PLAYING) {
      this.onPlay(time);
    } else if (state === window.YT.PlayerState.PAUSED) {
      this.onPause(time);
    }
  }

  private releaseSuppress(): void {
    window.clearTimeout(this.suppressTimer);
    this.suppressTimer = window.setTimeout(() => {
      this.suppress = false;
    }, 700);
  }

  // --- Von aussen (Remote-Sync) aufgerufen ---

  async applyLoad(videoId: string): Promise<void> {
    this.videoId = videoId;
    this.suppress = true;
    const player = await this.ensurePlayer(videoId);
    player.cueVideoById(videoId);
    this.releaseSuppress();
  }

  async applyPlay(time: number): Promise<void> {
    this.suppress = true;
    const player = await this.ensurePlayer(this.videoId || undefined);
    if (Number.isFinite(time)) {
      player.seekTo(time, true);
    }
    player.playVideo();
    this.releaseSuppress();
  }

  async applyPause(time: number): Promise<void> {
    this.suppress = true;
    const player = await this.ensurePlayer(this.videoId || undefined);
    if (Number.isFinite(time)) {
      player.seekTo(time, true);
    }
    player.pauseVideo();
    this.releaseSuppress();
  }

  // Aktueller Stand fuer spaet Beitretende (null, wenn kein Video laeuft).
  getState(): { videoId: string; time: number; playing: boolean } | null {
    if (!this.player || !this.videoId || !window.YT) {
      return null;
    }
    const playing = this.player.getPlayerState() === window.YT.PlayerState.PLAYING;
    return { videoId: this.videoId, time: this.player.getCurrentTime(), playing };
  }

  // Setzt einen empfangenen Gesamtzustand (Late-Join-Sync).
  async applyState(state: { videoId: string; time: number; playing: boolean }): Promise<void> {
    this.videoId = state.videoId;
    this.suppress = true;
    const player = await this.ensurePlayer(state.videoId);
    if (state.playing) {
      player.loadVideoById(state.videoId, state.time);
    } else {
      player.cueVideoById(state.videoId, state.time);
    }
    this.releaseSuppress();
  }

  // Verlassen der Insel: Wiedergabe stoppen und das IFrame entfernen, sodass
  // der Frame leer ist (jede Insel hat ihr eigenes Video).
  clear(): void {
    this.suppress = true;
    this.videoId = '';
    if (this.player) {
      try {
        this.player.destroy();
      } catch {
        // bereits zerstoert
      }
      this.player = undefined;
    }
    this.releaseSuppress();
  }

  private async submit(event: Event): Promise<void> {
    event.preventDefault();
    const input = this.querySelector<HTMLInputElement>('#watch-url');
    const id = input ? parseVideoId(input.value) : null;
    if (!id) {
      this.error = 'Konnte keine YouTube-ID erkennen.';
      return;
    }
    this.error = '';
    await this.applyLoad(id);
    // Lokales Cuen erfolgt durch applyLoad; den anderen mitteilen.
    this.onLoad(id);
  }

  render() {
    return html`
      <style>
        .sac-watch {
          display: block;
          background: var(--sac-color-surface);
          border: 1px solid var(--sac-color-border);
          border-radius: var(--sac-radius-md);
          padding: var(--sac-space-3);
        }
        .sac-watch h2 {
          font-size: 1rem;
          margin: 0 0 var(--sac-space-2);
        }
        .sac-watch form {
          display: flex;
          gap: var(--sac-space-2);
          margin-bottom: var(--sac-space-2);
        }
        .sac-watch input {
          flex: 1;
          min-height: var(--sac-tap-target);
          padding: 0 var(--sac-space-3);
          font-size: 1rem;
          border-radius: var(--sac-radius-sm);
          border: 1px solid var(--sac-color-border);
          background: var(--sac-color-bg);
          color: var(--sac-color-text);
        }
        .sac-watch button {
          min-height: var(--sac-tap-target);
          padding: 0 var(--sac-space-4);
          border: none;
          border-radius: var(--sac-radius-sm);
          background: var(--sac-color-accent);
          color: var(--sac-color-accent-contrast);
          font-size: 1rem;
          cursor: pointer;
        }
        .sac-watch-player {
          aspect-ratio: 16 / 9;
          width: 100%;
          background: #000;
          border-radius: var(--sac-radius-sm);
          overflow: hidden;
        }
        .sac-watch-player iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }
        .sac-watch-error {
          color: var(--sac-color-danger);
          margin: var(--sac-space-2) 0 0;
        }
        .sac-watch-note {
          color: var(--sac-color-muted);
          font-size: 0.85rem;
          margin: var(--sac-space-2) 0 0;
        }
      </style>
      <section class="sac-watch" aria-label="Gemeinsam Video schauen">
        <h2>Gemeinsam schauen</h2>
        <form @submit=${(event: Event) => void this.submit(event)}>
          <label class="sr-only" for="watch-url">YouTube-Link oder Video-ID</label>
          <input id="watch-url" type="text" autocomplete="off" placeholder="YouTube-Link oder ID ..." />
          <button type="submit">Laden</button>
        </form>
        <div class="sac-watch-player" ${ref((el) => this.setHost(el))}></div>
        ${this.error ? html`<p class="sac-watch-error" role="alert">${this.error}</p>` : ''}
        <p class="sac-watch-note">
          Wiedergabe und Pause werden in dieser Insel geteilt. Laedt YouTube (externe Quelle,
          nocookie) erst nach dem Laden eines Videos.
        </p>
      </section>
    `;
  }
}

customElements.define('sac-watch-panel', WatchPanel);
