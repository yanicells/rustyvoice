import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { useEffect, useState } from 'react'

import { phrasesFor, joinPromptText, type ScriptId } from '../harvard'
import {
  concatWavs,
  playWav,
  resolveMicIndex,
  startRecording,
  stopPlayback,
  stopRecording,
  wavDurationSec,
} from '../lib/audio'
import { voiceDir } from '../lib/paths'
import { newId } from '../lib/store'
import { formatClock } from '../lib/wav'
import type { Settings, Take, Voice } from '../types'
import { C, CONTENT_MAX_WIDTH } from '../theme'
import { Button, Field, Header, Meter, Pane } from './primitives'

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
  const [index, setIndex] = useState(0)
  const [takes, setTakes] = useState<Record<string, Take>>({})
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [tick, setTick] = useState(0)
  const [saving, setSaving] = useState(false)

  const phrases = phrasesFor(script)
  const phrase = phrases[index]
  const started = voiceId != null
  const recordedCount = Object.keys(takes).length
  const take = phrase ? takes[phrase.id] : undefined

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
    setIndex(0)
  }

  const record = async () => {
    if (!voiceId || !phrase || recording) return
    try {
      stopPlayback()
      const mic = await resolveMicIndex(settings.ffmpegPath, settings.micDevice)
      const outPath = join(voiceDir(voiceId), 'takes', `${phrase.id}.wav`)
      await startRecording({ ffmpegPath: settings.ffmpegPath, deviceIndex: mic.index, outPath })
      setElapsed(0)
      setRecording(true)
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error))
    }
  }

  const stop = async () => {
    if (!voiceId || !phrase) return
    try {
      await stopRecording()
      setRecording(false)
      const path = join(voiceDir(voiceId), 'takes', `${phrase.id}.wav`)
      const durationSec = wavDurationSec(path)
      if (durationSec < 0.6) {
        onError('That take was too short. Hold record while you read the line.')
        return
      }
      setTakes((current) => ({
        ...current,
        [phrase.id]: { phraseId: phrase.id, path, durationSec },
      }))
    } catch (error) {
      setRecording(false)
      onError(error instanceof Error ? error.message : String(error))
    }
  }

  const save = async () => {
    if (!voiceId || saving) return
    const ordered = phrases.map((item) => takes[item.id]).filter(Boolean)
    if (ordered.length === 0) {
      onError('Record at least one line')
      return
    }
    setSaving(true)
    try {
      const referencePath = join(voiceDir(voiceId), 'reference.wav')
      await concatWavs(
        settings.ffmpegPath,
        ordered.map((item) => item.path),
        referencePath,
      )
      const used = phrases.filter((item) => takes[item.id])
      const now = new Date().toISOString()
      onSaved({
        id: voiceId,
        name: name.trim(),
        createdAt: now,
        updatedAt: now,
        referencePath,
        promptText: joinPromptText(used),
        takes: ordered,
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
      <div
        style={{
          flexGrow: 1,
          minHeight: 0,
          overflowY: 'scroll',
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
          }}
        >
          {!started ? (
            <>
              <text style={{ fontSize: 22, fontWeight: 500, color: C.text }}>Record a reference</text>
              <text style={{ fontSize: 13.5, lineHeight: 20, color: C.secondary }}>
                Read Harvard sentences in a quiet room, one line at a time. Quick is three lines. Full is the first IEEE list of ten.
              </text>
              <Field label="Name" value={name} placeholder="Yani" onChange={setName} />
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                <ScriptCard
                  title="Quick"
                  body="3 sentences · about 20 seconds"
                  active={script === 'quick'}
                  onClick={() => setScript('quick')}
                />
                <ScriptCard
                  title="Full"
                  body="10 sentences · better coverage"
                  active={script === 'full'}
                  onClick={() => setScript('full')}
                />
              </div>
              <Button label="Start recording" icon="mic" variant="primary" onClick={begin} />
            </>
          ) : phrase ? (
            <>
              <text style={{ fontSize: 12, color: C.ghost }}>
                {index + 1} of {phrases.length} · {recordedCount} saved
              </text>
              <Dots total={phrases.length} index={index} takes={takes} phrases={phrases} />
              <div
                style={{
                  padding: 20,
                  borderRadius: 14,
                  backgroundColor: C.raised,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <text style={{ fontSize: 22, lineHeight: 32, color: C.text }}>{phrase.text}</text>
              </div>
              {recording ? (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Meter t={tick} />
                  <text style={{ fontSize: 18, color: C.accent }}>{formatClock(elapsed)}</text>
                </div>
              ) : take ? (
                <text style={{ fontSize: 13, color: C.ok }}>Saved {formatClock(take.durationSec)}</text>
              ) : (
                <text style={{ fontSize: 13, color: C.tertiary }}>Read it naturally. Stop when the line is done.</text>
              )}
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {recording ? (
                  <Button label="Stop" icon="square" variant="accent" onClick={() => void stop()} />
                ) : (
                  <Button
                    label={take ? 'Re-record' : 'Record'}
                    icon="mic"
                    variant="primary"
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
                  label="Skip"
                  icon="skip"
                  disabled={recording || index >= phrases.length - 1}
                  onClick={() => setIndex((value) => Math.min(phrases.length - 1, value + 1))}
                />
                <Button
                  label="Back"
                  disabled={recording || index === 0}
                  onClick={() => setIndex((value) => Math.max(0, value - 1))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                {index < phrases.length - 1 ? (
                  <Button
                    label="Next line"
                    variant="ghost"
                    disabled={recording}
                    onClick={() => setIndex((value) => Math.min(phrases.length - 1, value + 1))}
                  />
                ) : (
                  <Button
                    label={saving ? 'Saving…' : 'Save voice'}
                    variant="primary"
                    disabled={recording || recordedCount === 0 || saving}
                    onClick={() => void save()}
                  />
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
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
        flexGrow: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: C.raised,
        borderWidth: 1,
        borderColor: active ? C.accent : C.border,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <text style={{ fontSize: 14, color: C.text }}>{title}</text>
      <text style={{ fontSize: 12, color: C.tertiary, paddingTop: 4 }}>{body}</text>
    </div>
  )
}

function Dot({ filled, current }: { filled: boolean; current: boolean }) {
  return (
    <div
      style={{
        width: current ? 16 : 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: filled ? C.accent : current ? C.text : C.ghost,
        flexShrink: 0,
      }}
    />
  )
}

function Dots({
  total,
  index,
  takes,
  phrases,
}: {
  total: number
  index: number
  takes: Record<string, Take>
  phrases: { id: string }[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <Dot
          key={i}
          filled={Boolean(takes[phrases[i]?.id ?? ''])}
          current={i === index}
        />
      ))}
    </div>
  )
}
