import { expect, test } from 'bun:test'

import { HARVARD_FULL } from '../harvard'
import {
  PROMPT_MAX_SEC,
  busyLabelFromLog,
  formatCliFailure,
  promptTextForTakes,
  selectPromptTakes,
} from './prompt'
import type { Take } from '../types'

function take(id: string, durationSec: number): Take {
  return { phraseId: id, path: `/tmp/${id}.wav`, durationSec }
}

test('selectPromptTakes keeps a prefix under the VoxCPM2 budget', () => {
  const takes = [
    take('h01', 3.06),
    take('h02', 2.39),
    take('h03', 2.33),
    take('h04', 2.72),
    take('h05', 2.37),
    take('h06', 2.95),
    take('h07', 2.91),
    take('h08', 2.75),
    take('h09', 2.28),
    take('h10', 2.38),
    take('h11', 2.17),
  ]
  const selected = selectPromptTakes(takes)
  const total = selected.reduce((sum, item) => sum + item.durationSec, 0)
  expect(selected.map((item) => item.phraseId)).toEqual([
    'h01',
    'h02',
    'h03',
    'h04',
    'h05',
    'h06',
    'h07',
    'h08',
    'h09',
  ])
  expect(total).toBeLessThanOrEqual(PROMPT_MAX_SEC)
  expect(total).toBeGreaterThan(20)
})

test('selectPromptTakes always keeps the first take', () => {
  expect(selectPromptTakes([take('h01', 40)])).toHaveLength(1)
  expect(selectPromptTakes([])).toEqual([])
})

test('promptTextForTakes matches the Harvard lines that were kept', () => {
  const text = promptTextForTakes([take('h01', 3), take('h02', 3)])
  expect(text).toBe(`${HARVARD_FULL[0].text} ${HARVARD_FULL[1].text}`)
  expect(promptTextForTakes([take('unknown', 3)])).toBe('')
})

test('busyLabelFromLog hides file paths', () => {
  expect(busyLabelFromLog('Loading prompt WAV: /Users/yanicells/.voice-clone/voices/x/reference.wav')).toBe(
    'Loading prompt…',
  )
  expect(busyLabelFromLog('Loading VoxCPM2…')).toBe('Loading VoxCPM2…')
})

test('formatCliFailure maps ggml stack dumps', () => {
  const log = [
    '94 libggml-base.0.13.1.dylib ggml_visit_parents_graph + 528',
    '95 libggml-base.0.13.1.dylib ggml_visit_parents_graph + 528',
  ].join('\n')
  expect(formatCliFailure(log, 139)).toBe(
    'Prompt audio is too long for VoxCPM2. It wants about 5–30 seconds.',
  )
})
