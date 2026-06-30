// Verbindet eine Stimmquelle ueber Spatializer und Pegelanalyse mit dem Master.
import type { AudioEngine } from './AudioEngine';
import { VoiceSpatializer } from './VoiceSpatializer';
import { VoiceLevelAnalyser } from './VoiceLevelAnalyser';

export interface VoiceRoute {
  spatializer: VoiceSpatializer;
  analyser: VoiceLevelAnalyser;
  dispose(): void;
}

export function routeVoice(engine: AudioEngine, source: AudioNode): VoiceRoute {
  const ctx = engine.context;
  const spatializer = new VoiceSpatializer(ctx, source, engine.masterGain);
  const analyser = new VoiceLevelAnalyser(ctx, source);
  return {
    spatializer,
    analyser,
    dispose(): void {
      spatializer.dispose();
      analyser.dispose();
    },
  };
}