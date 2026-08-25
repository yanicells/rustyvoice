import { homedir } from 'node:os'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'

const LOCAL_MODELS = '/Users/yanicells/Documents/dev/local-models'
const LLAMA_BIN = join(LOCAL_MODELS, 'llama.cpp-omni/build/bin')
const LLAMA_MODELS = join(LOCAL_MODELS, 'llama.cpp-omni/models')

export function homeDir(): string {
  return process.env.VOICE_CLONE_HOME ?? join(homedir(), '.voice-clone')
}

export function voicesDir(): string {
  return join(homeDir(), 'voices')
}

export function generationsDir(): string {
  return join(homeDir(), 'generations')
}

export function storePath(): string {
  return join(homeDir(), 'studio.json')
}

export function voiceDir(id: string): string {
  return join(voicesDir(), id)
}

export function ensureDirs(): void {
  mkdirSync(voicesDir(), { recursive: true })
  mkdirSync(generationsDir(), { recursive: true })
}

export const DEFAULT_CLI = join(LLAMA_BIN, 'voxcpm2-cli')
export const DEFAULT_BASE_LM = join(LLAMA_MODELS, 'VoxCPM2-BaseLM-Q8_0.gguf')
export const DEFAULT_ACOUSTIC = join(LLAMA_MODELS, 'VoxCPM2-Acoustic-F16.gguf')
export const DEFAULT_FFMPEG = 'ffmpeg'
