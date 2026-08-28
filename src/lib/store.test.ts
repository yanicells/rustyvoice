import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'bun:test'

import { addGeneration, emptyStudio, loadStudio, removeVoice, saveStudio, upsertVoice } from './store'

const dirs: string[] = []

function withHome() {
  const dir = mkdtempSync(join(tmpdir(), 'voice-clone-'))
  dirs.push(dir)
  process.env.VOICE_CLONE_HOME = dir
  return dir
}

afterEach(() => {
  delete process.env.VOICE_CLONE_HOME
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

test('loadStudio writes defaults on first run', () => {
  withHome()
  const data = loadStudio()
  expect(data.voices).toEqual([])
  expect(data.settings.autoPlay).toBe(true)
  expect(data.settings.cliPath).toContain('voxcpm2-cli')
})

test('upsert and remove voices persist', () => {
  withHome()
  let data = loadStudio()
  data = upsertVoice(data, {
    id: 'v1',
    name: 'Yani',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    referencePath: '/tmp/ref.wav',
    promptText: 'hello',
    takes: [],
    source: 'record',
    durationSec: 3,
  })
  saveStudio(data)
  expect(loadStudio().voices[0]?.name).toBe('Yani')
  data = removeVoice(loadStudio(), 'v1')
  saveStudio(data)
  expect(loadStudio().voices).toHaveLength(0)
})

test('generation history keeps newest first', () => {
  let data = emptyStudio()
  data = addGeneration(data, {
    id: 'g1',
    voiceId: null,
    voiceName: 'Design',
    text: 'one',
    path: '/tmp/a.wav',
    createdAt: '2026-01-01T00:00:00.000Z',
    elapsedMs: 10,
    durationSec: 1,
    mode: 'design',
  })
  data = addGeneration(data, {
    id: 'g2',
    voiceId: null,
    voiceName: 'Design',
    text: 'two',
    path: '/tmp/b.wav',
    createdAt: '2026-01-01T00:00:01.000Z',
    elapsedMs: 10,
    durationSec: 1,
    mode: 'design',
  })
  expect(data.generations.map((item) => item.id)).toEqual(['g2', 'g1'])
})
