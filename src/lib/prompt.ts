import { HARVARD_FULL, joinPromptText } from '../harvard'
import type { Take } from '../types'

/** VoxCPM2 is stable with about 5–30s of prompt audio. Longer clips blow the ggml graph. */
export const PROMPT_MAX_SEC = 25

export function selectPromptTakes(takes: Take[], maxSec = PROMPT_MAX_SEC): Take[] {
  const selected: Take[] = []
  let total = 0
  for (const take of takes) {
    if (selected.length > 0 && total + take.durationSec > maxSec) break
    selected.push(take)
    total += take.durationSec
  }
  return selected
}

export function promptTextForTakes(takes: Take[]): string {
  const byId = new Map(HARVARD_FULL.map((phrase) => [phrase.id, phrase]))
  const phrases = takes.map((take) => byId.get(take.phraseId)).filter((phrase) => phrase != null)
  if (phrases.length !== takes.length) return ''
  return joinPromptText(phrases)
}

export function busyLabelFromLog(line: string): string | null {
  const clean = line.replace(/^.*\]\s*/, '').trim()
  if (!clean) return null
  if (/Loading prompt WAV/i.test(clean)) return 'Loading prompt…'
  if (/Loading reference WAV/i.test(clean)) return 'Loading reference…'
  if (/Generating|Elapsed|Audio:/i.test(clean)) return clean.slice(0, 60)
  if (/Loading/i.test(clean)) return 'Loading VoxCPM2…'
  return null
}

export function formatCliFailure(log: string, code: number): string {
  if (/ggml_visit_parents_graph|ggml/i.test(log)) {
    return 'Prompt audio is too long for VoxCPM2. It wants about 5–30 seconds.'
  }
  const last = log
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/libggml|ggml_/i.test(line))
    .slice(-2)
    .join('\n')
  return last || `voxcpm2-cli exited ${code}`
}
