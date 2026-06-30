// Registriert die eingebauten Plugins. Neue Plugins werden hier ergaenzt
// oder spaeter dynamisch geladen.
import type { SacPlugin } from '../core/PluginManifest';
import { createChatPlugin } from './chat';
import { createEmotesPlugin } from './emotes';
import { createSoundGesturesPlugin } from './sound-gestures';
import { createGamesPlugin } from './games';
import { createWatchPlugin } from './watch';

export function createBuiltinPlugins(): SacPlugin[] {
  return [
    createChatPlugin(),
    createEmotesPlugin(),
    createSoundGesturesPlugin(),
    createGamesPlugin(),
    createWatchPlugin(),
  ];
}