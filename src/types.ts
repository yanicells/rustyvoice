export type Page = 'speak' | 'voices' | 'settings' | 'create'

export type VoiceSource = 'record' | 'import'

export interface Take {
  phraseId: string
  path: string
  durationSec: number
}

export interface Voice {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  referencePath: string
  promptText: string
  takes: Take[]
  source: VoiceSource
  durationSec: number
}

export type GenerationMode = 'clone' | 'design'

export interface Generation {
  id: string
  voiceId: string | null
  voiceName: string
  text: string
  path: string
  createdAt: string
  elapsedMs: number
  durationSec: number
  mode: GenerationMode
}

export interface Settings {
  cliPath: string
  baseLmPath: string
  acousticPath: string
  ffmpegPath: string
  micDevice: string
  nGpuLayers: number
  seed: number
  cfg: number
  timesteps: number
  temperature: number
  maxSteps: number
  autoPlay: boolean
  useCpu: boolean
}

export interface StudioData {
  settings: Settings
  voices: Voice[]
  generations: Generation[]
  selectedVoiceId: string | null
}
