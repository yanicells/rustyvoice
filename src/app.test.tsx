import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, test } from 'bun:test'
import { createTestRoot } from '@gpuix/react/testing'

import { App } from './app'
import { defaultSettings, emptyStudio } from './lib/store'
import { CreateVoicePage } from './ui/create-voice'
import { SpeakPage } from './ui/speak'
import { VoicesPage } from './ui/voices'

let home = ''

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'voice-clone-ui-'))
  process.env.VOICE_CLONE_HOME = home
})

afterEach(() => {
  delete process.env.VOICE_CLONE_HOME
  rmSync(home, { recursive: true, force: true })
})

test('paints studio chrome', () => {
  const { render, renderer } = createTestRoot()
  render(<App />)
  renderer.flush()
  const text = renderer.getPaintedText().join(' ')
  expect(text).toContain('Clone')
  expect(text).toContain('Speak')
  expect(text).toContain('VoxCPM2')
  expect(text).toContain('Write the line')
})

test('speak empty state and samples stay readable', () => {
  const { render, renderer } = createTestRoot()
  render(
    <SpeakPage
      data={emptyStudio()}
      busy={null}
      logLine=""
      onSpeak={() => undefined}
      onDelete={() => undefined}
    />,
  )
  renderer.flush()
  const text = renderer.getPaintedText().join(' ')
  expect(text).toContain('Describe a voice, then speak')
  expect(text).toContain('Hello, this is a clone')
  expect(text).toContain('Birch canoe')
})

test('generation rows label audio length vs synthesis time', () => {
  const data = emptyStudio()
  data.generations = [
    {
      id: 'g1',
      voiceId: null,
      voiceName: 'Design',
      text: 'The birch canoe slid on the smooth planks.',
      path: '/tmp/missing.wav',
      createdAt: new Date().toISOString(),
      elapsedMs: 12340,
      durationSec: 4,
      mode: 'design',
    },
  ]
  const { render, renderer } = createTestRoot()
  render(
    <SpeakPage data={data} busy={null} logLine="" onSpeak={() => undefined} onDelete={() => undefined} />,
  )
  renderer.flush()
  const text = renderer.getPaintedText().join(' ')
  expect(text).toContain('0:04 audio')
  expect(text).toContain('12.3s gen')
  expect(text).toContain('The birch canoe slid on the smooth planks.')
})

test('voices page keeps Speak on the card', () => {
  const data = emptyStudio()
  data.voices = [
    {
      id: 'v1',
      name: 'Yani',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      referencePath: '/tmp/ref.wav',
      promptText: 'hello',
      takes: [],
      source: 'record',
      durationSec: 3,
    },
  ]
  data.selectedVoiceId = 'v1'
  const { render, renderer } = createTestRoot()
  render(
    <VoicesPage
      data={data}
      onCreate={() => undefined}
      onImported={() => undefined}
      onDelete={() => undefined}
      onRename={() => undefined}
      onSelect={() => undefined}
      onUse={() => undefined}
      onError={() => undefined}
    />,
  )
  renderer.flush()
  const text = renderer.getPaintedText().join(' ')
  expect(text).toContain('Yani')
  expect(text).toContain('in use')
  expect(text).toContain('Speak')
})

test('record setup stacks script cards as Quick and Full', () => {
  const { render, renderer } = createTestRoot()
  render(
    <CreateVoicePage
      settings={defaultSettings()}
      onCancel={() => undefined}
      onSaved={() => undefined}
      onError={() => undefined}
    />,
  )
  renderer.flush()
  const text = renderer.getPaintedText().join(' ')
  expect(text).toContain('Record a reference')
  expect(text).toContain('Quick')
  expect(text).toContain('Full')
  expect(text).toContain('Start recording')
  expect(text).toContain('one take')
})
