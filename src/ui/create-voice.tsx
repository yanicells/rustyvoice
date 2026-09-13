import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { useEffect, useState } from 'react'

import { joinParagraphs, paragraphsFor, type ScriptId } from '../harvard'
import { concatWavs, playWav, resolveMicIndex, startRecording, stopPlayback, stopRecording, wavDurationSec } from '../lib/audio'
import { voiceDir } from '../lib/paths'
import { newId } from '../lib/store'
import { formatClock } from '../lib/wav'
import type { Settings, Take, Voice } from '../types'
import { C } from '../theme'
import { Button, Column, Field, Header, Meter, Pane, Scroller } from './primitives'

export function CreateVoicePage({
  settings,
  onCancel,
  onSaved,
  onError,
}: {
  settings: Settings
  onCancel: () => void
  onSaved: (voice: Voice) => void
  onError: (message: string) => void
}) {
  const [name, setName] = useState('')
  const [script, setScript] = useState<ScriptId>('quick')
  const [voiceId, setVoiceId] = useState<string | null>(null)
  const [take, setTake] = useState<Take | null>(null)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [tick, setTick] = useState(0)
  const [saving, setSaving] = useState(false)

  const paragraphs = paragraphsFor(script)
  const promptText = joinParagraphs(paragraphs)
  const started = voiceId != null

  useEffect(() => {
    if (!recording) return
    const startedAt = Date.now()
    const id = setInterval(() => {
      setElapsed((Date.now() - startedAt) / 1000)
      setTick((value) => value + 0.08)
    }, 80)
    return () => clearInterval(id)
  }, [recording])

  const begin = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      onError('Name the voice first')
      return
    }
    const id = newId('voice')
    mkdirSync(join(voiceDir(id), 'takes'), { recursive: true })
    setVoiceId(id)
  }

  const record = async () => {
    if (!voiceId || recording) return
    try {
      stopPlayback()
      const mic = await resolveMicIndex(settings.ffmpegPath, settings.micDevice)
      const outPath = join(voiceDir(voiceId), 'takes', 'script.wav')
      await startRecording({ ffmpegPath: settings.ffmpegPath, deviceIndex: mic.index, outPath })
      setElapsed(0)
      setRecording(true)
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error))
    }
  }

  const stop = async () => {
    if (!voiceId) return
    try {
      await stopRecording()
      setRecording(false)
      const path = join(voiceDir(voiceId), 'takes', 'script.wav')
      const durationSec = wavDurationSec(path)
      if (durationSec < 2) {
        onError('That take was too short. Hold record while you read the whole script.')
        return
      }
      setTake({ phraseId: 'script', path, durationSec })
    } catch (error) {
      setRecording(false)
      onError(error instanceof Error ? error.message : String(error))
    }
  }

  const save = async () => {
    if (!voiceId || !take || saving) return
    setSaving(true)
    try {
      const referencePath = join(voiceDir(voiceId), 'reference.wav')
      await concatWavs(settings.ffmpegPath, [take.path], referencePath)
      const now = new Date().toISOString()
      onSaved({
        id: voiceId,
        name: name.trim(),
        createdAt: now,
        updatedAt: now,
        referencePath,
        promptText,
        takes: [{ ...take, path: referencePath, durationSec: wavDurationSec(referencePath) }],
        source: 'record',
        durationSec: wavDurationSec(referencePath),
      })
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error))
      setSaving(false)
    }
  }

  return (
    <Pane>
      <Header title="New voice">
        <Button label="Cancel" onClick={onCancel} />
      </Header>
      <Scroller>
        <Column gap={18}>
          {!started ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <text style={{ fontSize: 22, fontWeight: 500, color: C.text }}>Record a reference</text>
                <text style={{ fontSize: 13.5, lineHeight: 20, color: C.secondary, whiteSpace: 'normal' }}>
                  Read the Harvard script in a quiet room, in one take. Quick is a short paragraph. Full is a few paragraphs; VoxCPM2 still clones from about 25 seconds.
                </text>
              </div>
              <Field label="Name" value={name} placeholder="Voice name" onChange={setName} />
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                <ScriptCard
                  title="Quick"
                  body="One short paragraph · about 20 seconds"
                  active={script === 'quick'}
                  onClick={() => setScript('quick')}
                />
                <ScriptCard
                  title="Full"
                  body="A few paragraphs · one take"
                  active={script === 'full'}
                  onClick={() => setScript('full')}
                />
              </div>
              <Button label="Start recording" icon="mic" variant="primary" testId="start-record" onClick={begin} />
            </>
          ) : (
            <>
              <text style={{ fontSize: 12, color: C.ghost }}>
                {take ? `Saved ${formatClock(take.durationSec)}` : 'One take · read it like a page, not a list'}
              </text>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  padding: 20,
                  borderRadius: 14,
                  backgroundColor: C.raised,
                  borderWidth: 1,
                  borderColor: recording ? C.accent : C.border,
                }}
              >
                {paragraphs.map((paragraph) => (
                  <text
                    key={paragraph.slice(0, 24)}
                    style={{ fontSize: 16, lineHeight: 24, color: C.text, whiteSpace: 'normal' }}
                  >
                    {paragraph}
                  </text>
                ))}
              </div>
              {recording ? (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Meter t={tick} />
                  <text style={{ fontSize: 18, color: C.accent }}>{formatClock(elapsed)}</text>
                </div>
              ) : (
                <text style={{ fontSize: 13, color: take ? C.ok : C.tertiary, whiteSpace: 'normal' }}>
                  {take ? 'Keep this take, or record again.' : 'Read it naturally. Stop when the last paragraph is done.'}
                </text>
              )}
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {recording ? (
                  <Button label="Stop" icon="square" variant="accent" onClick={() => void stop()} />
                ) : (
                  <Button
                    label={take ? 'Re-record' : 'Record'}
                    icon="mic"
                    variant={take ? 'ghost' : 'primary'}
                    onClick={() => void record()}
                  />
                )}
                <Button
                  label="Listen"
                  icon="play"
                  disabled={!take || recording}
                  onClick={() => take && void playWav(take.path)}
                />
                <Button
                  label={saving ? 'Saving…' : 'Save voice'}
                  variant="primary"
                  disabled={recording || !take || saving}
                  onClick={() => void save()}
                />
              </div>
            </>
          )}
        </Column>
      </Scroller>
    </Pane>
  )
}

function ScriptCard({
  title,
  body,
  active,
  onClick,
}: {
  title: string
  body: string
  active: boolean
  onClick: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flexGrow: 1,
        minWidth: 0,
        padding: 14,
        borderRadius: 10,
        backgroundColor: active ? C.accentDim : C.raised,
        borderWidth: 1,
        borderColor: active ? C.accent : C.border,
        cursor: 'pointer',
        hover: { borderColor: active ? C.accent : C.borderStrong },
      }}
      onClick={onClick}
    >
      <text style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{title}</text>
      <text style={{ fontSize: 12, lineHeight: 16, color: C.tertiary, whiteSpace: 'normal' }}>{body}</text>
    </div>
  )
}
