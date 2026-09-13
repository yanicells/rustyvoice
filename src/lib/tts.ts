import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { firstPromptSlice } from '../harvard'
import type { Settings, Voice } from '../types'
import { concatWavs, trimWav, wavDurationSec } from './audio'
import { voiceDir } from './paths'
import { PROMPT_MAX_SEC, formatCliFailure, promptTextForTakes, selectPromptTakes } from './prompt'

export interface SynthesizeInput {
  text: string
  outPath: string
  referencePath?: string
  promptText?: string
  onLog?: (line: string) => void
}

export interface SynthesizeResult {
  elapsedMs: number
  log: string
}

function whichMissing(settings: Settings): string | null {
  if (!existsSync(settings.cliPath)) return `voxcpm2-cli not found at ${settings.cliPath}`
  if (!existsSync(settings.baseLmPath)) return `BaseLM GGUF not found at ${settings.baseLmPath}`
  if (!existsSync(settings.acousticPath)) return `Acoustic GGUF not found at ${settings.acousticPath}`
  return null
}

export function modelStatus(settings: Settings): { ok: boolean; detail: string } {
  const missing = whichMissing(settings)
  if (missing) return { ok: false, detail: missing }
  return { ok: true, detail: 'VoxCPM2 ready' }
}

export async function synthesize(settings: Settings, input: SynthesizeInput): Promise<SynthesizeResult> {
  const missing = whichMissing(settings)
  if (missing) throw new Error(missing)
  const text = input.text.trim()
  if (!text) throw new Error('Type something to speak')

  const args = [settings.cliPath, '-t', text, '-o', input.outPath]
  if (input.referencePath && input.promptText?.trim()) {
    args.push('--prompt-wav', input.referencePath, '--prompt-text', input.promptText.trim())
  } else if (input.referencePath) {
    args.push('-r', input.referencePath)
  }
  args.push('--steps', String(settings.maxSteps))
  args.push('--timesteps', String(settings.timesteps))
  args.push('--cfg', String(settings.cfg))
  args.push('--temperature', String(settings.temperature))
  args.push('--seed', String(settings.seed))
  args.push('--n-gpu-layers', String(settings.nGpuLayers))
  if (settings.useCpu) args.push('--cpu')
  args.push(settings.baseLmPath, settings.acousticPath)

  const started = Date.now()
  const proc = Bun.spawn(args, { stdout: 'pipe', stderr: 'pipe', stdin: 'ignore' })
  const [stdout, stderr, code] = await Promise.all([
    streamLines(proc.stdout, input.onLog),
    streamLines(proc.stderr, input.onLog),
    proc.exited,
  ])
  const log = `${stdout}\n${stderr}`.trim()
  if (code !== 0) {
    throw new Error(formatCliFailure(log, code))
  }
  if (!existsSync(input.outPath)) throw new Error('Synthesis finished without a WAV file')
  return { elapsedMs: Date.now() - started, log }
}

async function streamLines(
  stream: ReadableStream<Uint8Array> | number | undefined,
  onLog?: (line: string) => void,
): Promise<string> {
  if (!stream || typeof stream === 'number') return ''
  const text = await new Response(stream).text()
  if (onLog) {
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (trimmed) onLog(trimmed)
    }
  }
  return text
}

export async function prepareClonePrompt(
  settings: Settings,
  voice: Voice,
): Promise<{ referencePath: string; promptText?: string }> {
  const outPath = join(voiceDir(voice.id), 'prompt.wav')
  const slice = firstPromptSlice(voice.promptText) || undefined
  const longSingleTake = voice.takes.length <= 1

  if (voice.takes.length > 1) {
    const selected = selectPromptTakes(voice.takes)
    const text = promptTextForTakes(selected)
    const total = selected.reduce((sum, take) => sum + take.durationSec, 0)
    if (selected.length === voice.takes.length && total <= PROMPT_MAX_SEC) {
      return { referencePath: voice.referencePath, promptText: voice.promptText.trim() || text || undefined }
    }
    await concatWavs(
      settings.ffmpegPath,
      selected.map((take) => take.path),
      outPath,
    )
    return { referencePath: outPath, promptText: text || slice }
  }

  const src = voice.takes[0]?.path ?? voice.referencePath
  const duration = voice.takes[0]?.durationSec || voice.durationSec || wavDurationSec(src)
  if (duration > PROMPT_MAX_SEC) {
    await trimWav(settings.ffmpegPath, src, outPath, PROMPT_MAX_SEC)
    return { referencePath: outPath, promptText: longSingleTake ? slice : undefined }
  }
  return { referencePath: src, promptText: voice.promptText.trim() || slice }
}
