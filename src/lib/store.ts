import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  DEFAULT_ACOUSTIC,
  DEFAULT_BASE_LM,
  DEFAULT_CLI,
  DEFAULT_FFMPEG,
  ensureDirs,
  generationsDir,
  homeDir,
  storePath,
  voiceDir,
} from './paths'
import type { Generation, Settings, StudioData, Voice } from '../types'

export function defaultSettings(): Settings {
  return {
    cliPath: process.env.VOXCPM2_CLI ?? DEFAULT_CLI,
    baseLmPath: process.env.VOXCPM2_BASE_LM ?? DEFAULT_BASE_LM,
    acousticPath: process.env.VOXCPM2_ACOUSTIC ?? DEFAULT_ACOUSTIC,
    ffmpegPath: process.env.FFMPEG ?? DEFAULT_FFMPEG,
    micDevice: 'auto',
    nGpuLayers: -1,
    seed: 42,
    cfg: 2,
    timesteps: 10,
    temperature: 1,
    maxSteps: 200,
    autoPlay: true,
    useCpu: false,
  }
}

export function emptyStudio(): StudioData {
  return {
    settings: defaultSettings(),
    voices: [],
    generations: [],
    selectedVoiceId: null,
  }
}

function mergeSettings(raw: Partial<Settings> | undefined): Settings {
  return { ...defaultSettings(), ...raw }
}

export function loadStudio(): StudioData {
  ensureDirs()
  const path = storePath()
  if (!existsSync(path)) {
    const fresh = emptyStudio()
    saveStudio(fresh)
    return fresh
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<StudioData>
    const data: StudioData = {
      settings: mergeSettings(parsed.settings),
      voices: Array.isArray(parsed.voices) ? parsed.voices : [],
      generations: Array.isArray(parsed.generations) ? parsed.generations : [],
      selectedVoiceId: parsed.selectedVoiceId ?? null,
    }
    if (data.selectedVoiceId && !data.voices.some((voice) => voice.id === data.selectedVoiceId)) {
      data.selectedVoiceId = data.voices[0]?.id ?? null
    }
    return data
  } catch {
    return emptyStudio()
  }
}

export function saveStudio(data: StudioData): void {
  ensureDirs()
  mkdirSync(homeDir(), { recursive: true })
  writeFileSync(storePath(), JSON.stringify(data, null, 2))
}

export function upsertVoice(data: StudioData, voice: Voice): StudioData {
  const index = data.voices.findIndex((item) => item.id === voice.id)
  const voices = [...data.voices]
  if (index >= 0) voices[index] = voice
  else voices.unshift(voice)
  return { ...data, voices, selectedVoiceId: voice.id }
}

export function removeVoice(data: StudioData, id: string): StudioData {
  rmSync(voiceDir(id), { recursive: true, force: true })
  const voices = data.voices.filter((voice) => voice.id !== id)
  const selectedVoiceId =
    data.selectedVoiceId === id ? (voices[0]?.id ?? null) : data.selectedVoiceId
  return { ...data, voices, selectedVoiceId }
}

export function addGeneration(data: StudioData, generation: Generation): StudioData {
  return {
    ...data,
    generations: [generation, ...data.generations].slice(0, 80),
  }
}

export function removeGeneration(data: StudioData, id: string): StudioData {
  const generation = data.generations.find((item) => item.id === id)
  if (generation) rmSync(generation.path, { force: true })
  return {
    ...data,
    generations: data.generations.filter((item) => item.id !== id),
  }
}

export function generationPath(id: string): string {
  return join(generationsDir(), `${id}.wav`)
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
