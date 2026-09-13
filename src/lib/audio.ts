import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'

import { pcmWavDurationSec } from './wav'

export interface AudioDevice {
  index: number
  name: string
}

async function readOutput(stream: ReadableStream<Uint8Array> | number | undefined | null): Promise<string> {
  if (!stream || typeof stream === 'number') return ''
  return new Response(stream).text()
}

export function parseAvfoundationDevices(stderr: string): AudioDevice[] {
  const lines = stderr.split(/\r?\n/)
  const devices: AudioDevice[] = []
  let inAudio = false
  for (const line of lines) {
    if (/AVFoundation audio devices:/i.test(line)) {
      inAudio = true
      continue
    }
    if (inAudio && /AVFoundation video devices:/i.test(line)) break
    if (!inAudio) continue
    const match = line.match(/\[(\d+)\]\s+(.+?)\s*$/)
    if (match) devices.push({ index: Number(match[1]), name: match[2] })
  }
  return devices
}

export function pickDefaultMic(devices: AudioDevice[]): AudioDevice | null {
  if (devices.length === 0) return null
  const usable = devices.filter((device) => !/zoom/i.test(device.name))
  const pool = usable.length > 0 ? usable : devices
  return (
    pool.find((device) => /macbook.*microphone/i.test(device.name)) ??
    pool.find((device) => /microphone/i.test(device.name)) ??
    pool[pool.length - 1]
  )
}

export async function listAudioDevices(ffmpegPath: string): Promise<AudioDevice[]> {
  const proc = Bun.spawn([ffmpegPath, '-hide_banner', '-f', 'avfoundation', '-list_devices', 'true', '-i', ''], {
    stdout: 'ignore',
    stderr: 'pipe',
  })
  const stderr = await readOutput(proc.stderr)
  await proc.exited
  return parseAvfoundationDevices(stderr)
}

export async function resolveMicIndex(
  ffmpegPath: string,
  preference: string,
): Promise<{ index: number; name: string }> {
  const devices = await listAudioDevices(ffmpegPath)
  if (devices.length === 0) throw new Error('No microphones found')
  if (preference !== 'auto') {
    const byIndex = devices.find((device) => String(device.index) === preference)
    if (byIndex) return byIndex
    const byName = devices.find((device) => device.name === preference)
    if (byName) return byName
  }
  const picked = pickDefaultMic(devices)
  if (!picked) throw new Error('No microphones found')
  return picked
}

export function wavDurationSec(path: string): number {
  if (!existsSync(path)) return 0
  return pcmWavDurationSec(readFileSync(path))
}

let recorder: ReturnType<typeof Bun.spawn> | null = null
let player: ReturnType<typeof Bun.spawn> | null = null

export function isRecording(): boolean {
  return recorder != null
}

export async function startRecording(opts: {
  ffmpegPath: string
  deviceIndex: number
  outPath: string
}): Promise<void> {
  if (recorder) await stopRecording()
  recorder = Bun.spawn(
    [
      opts.ffmpegPath,
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'avfoundation',
      '-i',
      `none:${opts.deviceIndex}`,
      '-ac',
      '1',
      '-ar',
      '48000',
      '-c:a',
      'pcm_s16le',
      opts.outPath,
    ],
    { stdin: 'ignore', stdout: 'ignore', stderr: 'pipe' },
  )
}

export async function stopRecording(): Promise<{ stderr: string }> {
  const proc = recorder
  recorder = null
  if (!proc) return { stderr: '' }
  proc.kill('SIGINT')
  const stderr = await readOutput(proc.stderr)
  const code = await proc.exited
  if (code !== 0 && code !== 255 && stderr.trim()) {
    throw new Error(stderr.trim().split('\n').slice(-3).join('\n'))
  }
  return { stderr }
}

export async function playWav(path: string): Promise<void> {
  stopPlayback()
  if (!existsSync(path)) throw new Error(`Missing audio file: ${basename(path)}`)
  const cmd = process.platform === 'darwin' ? ['afplay', path] : ['ffplay', '-nodisp', '-autoexit', path]
  player = Bun.spawn(cmd, { stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' })
  await player.exited
  player = null
}

export function stopPlayback(): void {
  if (!player) return
  player.kill()
  player = null
}

export async function concatWavs(ffmpegPath: string, inputs: string[], outPath: string): Promise<void> {
  if (inputs.length === 0) throw new Error('No recordings to join')
  if (inputs.length === 1) {
    const proc = Bun.spawn(
      [ffmpegPath, '-hide_banner', '-loglevel', 'error', '-y', '-i', inputs[0], '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', outPath],
      { stdout: 'ignore', stderr: 'pipe' },
    )
    const stderr = await readOutput(proc.stderr)
    const code = await proc.exited
    if (code !== 0) throw new Error(stderr.trim() || 'ffmpeg failed')
    return
  }
  const list = inputs.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join('\n')
  const listPath = `${outPath}.concat.txt`
  await Bun.write(listPath, list)
  const proc = Bun.spawn(
    [
      ffmpegPath,
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-ac',
      '1',
      '-ar',
      '48000',
      '-c:a',
      'pcm_s16le',
      outPath,
    ],
    { stdout: 'ignore', stderr: 'pipe' },
  )
  const stderr = await readOutput(proc.stderr)
  const code = await proc.exited
  if (code !== 0) throw new Error(stderr.trim() || 'ffmpeg concat failed')
}

export async function trimWav(
  ffmpegPath: string,
  src: string,
  dest: string,
  durationSec: number,
): Promise<void> {
  const proc = Bun.spawn(
    [
      ffmpegPath,
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      src,
      '-t',
      durationSec.toFixed(2),
      '-ac',
      '1',
      '-ar',
      '48000',
      '-c:a',
      'pcm_s16le',
      dest,
    ],
    { stdout: 'ignore', stderr: 'pipe' },
  )
  const stderr = await readOutput(proc.stderr)
  const code = await proc.exited
  if (code !== 0) throw new Error(stderr.trim() || 'ffmpeg trim failed')
}

export async function importWav(ffmpegPath: string, src: string, dest: string): Promise<void> {
  const proc = Bun.spawn(
    [ffmpegPath, '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', dest],
    { stdout: 'ignore', stderr: 'pipe' },
  )
  const stderr = await readOutput(proc.stderr)
  const code = await proc.exited
  if (code !== 0) throw new Error(stderr.trim() || 'Could not import that audio file')
}

export async function pickAudioFile(): Promise<string | null> {
  if (process.platform !== 'darwin') return null
  const proc = Bun.spawn(
    [
      'osascript',
      '-e',
      'try\nPOSIX path of (choose file with prompt "Choose a WAV or audio file" of type {"public.audio", "WAVE", "wav", "mp3", "m4a", "aiff"})\non error\nreturn ""\nend try',
    ],
    { stdout: 'pipe', stderr: 'ignore' },
  )
  const out = (await readOutput(proc.stdout)).trim()
  await proc.exited
  return out.length > 0 ? out : null
}

export function revealInFinder(path: string): void {
  if (process.platform === 'darwin') {
    Bun.spawn(['open', '-R', path], { stdout: 'ignore', stderr: 'ignore' })
    return
  }
  Bun.spawn(['xdg-open', path], { stdout: 'ignore', stderr: 'ignore' })
}
