// Klanggesten: zeigt, wie Interaktionen die KlangNode-Registry und die
// Audio-Engine nutzen. Jede Geste ist als KlangNode-Fabrik registriert.
import type { SacPlugin } from '../../core/PluginManifest';
import type { KlangNodeFactory } from '../../audio/KlangNode';
import type { SoundGesturePayload } from '../../types';
import { $participants } from '../../core/Store';
import { DEFAULT_GESTURES, GestureBar } from './gesture-bar';

function makeChimeFactory(kind: string, label: string, freq: number): KlangNodeFactory {
  return {
    kind,
    title: label,
    create(ctx) {
      const gain = ctx.createGain();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.3);
      return {
        id: crypto.randomUUID(),
        kind,
        output: gain,
        dispose(): void {
          try {
            osc.stop();
          } catch {
            // bereits gestoppt
          }
          gain.disconnect();
        },
      };
    },
  };
}

export function createSoundGesturesPlugin(): SacPlugin {
  const bar = new GestureBar();
  return {
    manifest: {
      id: 'sound-gestures',
      title: 'Klanggesten',
      version: '0.1.0',
      description: 'Kurze Klaenge als nonverbale Gesten.',
      capabilities: ['message', 'audio', 'ui'],
    },
    setup(ctx) {
      for (const gesture of DEFAULT_GESTURES) {
        ctx.klangNodes.register(makeChimeFactory(gesture.id, gesture.label, gesture.freq));
      }

      bar.onGesture = (gestureId) =>
        ctx.sendMessage('sound-gesture', 'play', { gestureId } satisfies SoundGesturePayload);

      ctx.bus.on('message:received', (envelope) => {
        if (envelope.channel !== 'sound-gesture') {
          return;
        }
        const payload = envelope.payload as SoundGesturePayload;
        if (ctx.audio.isUnlocked && ctx.klangNodes.has(payload.gestureId)) {
          const node = ctx.klangNodes.create(payload.gestureId, ctx.audio.context);
          node.output.connect(ctx.audio.masterGain);
          window.setTimeout(() => node.dispose(), 1500);
        }
        const name = $participants.get()[envelope.senderId]?.displayName ?? 'Jemand';
        const def = DEFAULT_GESTURES.find((g) => g.id === payload.gestureId);
        ctx.announcer.announce(`${name} sendet Klanggeste: ${def?.label ?? payload.gestureId}.`);
      });

      ctx.ui.mount('island-toolbar', { pluginId: 'sound-gestures', element: bar, order: 30 });
    },
  };
}